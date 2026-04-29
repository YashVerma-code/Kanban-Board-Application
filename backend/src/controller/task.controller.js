import Board from "../model/board.model.js";
import Task from "../model/task.model.js";
import mongoose from "mongoose";
import { logAction } from "../lib/logAction.js";
import { io } from "../lib/socket.js";

export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, status, priority, boardId } =
      req.body;
    if (
      !title ||
      !description ||
      !boardId ||
      !assignedTo ||
      !status ||
      !priority
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }
    const normalizedTitle = title.trim().toLowerCase();
    const oldTask = await Task.findOne({
      title: normalizedTitle,
      description,
      boardId,
    });
    if (oldTask) {
      return res.status(400).json({
        message: "Task is already created !",
      });
    }
    const newTask = new Task({
      title: normalizedTitle,
      description,
      boardId,
      assignedTo,
      status,
      priority,
    });
    if (newTask) {
      await newTask.save();
      await Board.findByIdAndUpdate(boardId, { $push: { tasks: newTask._id } });
      await logAction(
        req.user.id,
        newTask._id,
        boardId,
        "created",
        `${normalizedTitle.toUpperCase()} task is created !`
      );

      io.to(boardId.toString()).emit("task:create", newTask);
      io.emit("recentActions", newTask);
      return res.status(200).json(newTask);
    } else {
      return res.status(400).json({ message: "Invalid task details " });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { version, ...updates } = req.body;
    const userId = req.user.id;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // auto clear expired lock
    if (
      task.lockExpiresAt &&
      task.lockExpiresAt < new Date()
    ) {
      task.lockedBy = null;
      task.lockExpiresAt = null;
    }

    // lock ownership check
    if (
      task.lockedBy &&
      task.lockedBy.toString() !== userId.toString()
    ) {
      return res.status(409).json({
        message: "Another user is editing this task",
      });
    }

    // version conflict check
    if (task.version !== version) {
      console.log("task.version: ",task.version," Version: ",version);
      return res.status(409).json({
        message: "Task is already updated by other",
        latestTask: task,
      });
    }

    Object.assign(task, updates);

    task.version += 1;
    task.lastModified = new Date();

    // unlock after save
    task.lockedBy = null;
    task.lockExpiresAt = null;

    await task.save();

    io.to(task.boardId.toString()).emit("task:update", task);

    return res.status(200).json(task);
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log("Updates contains : ", updates);
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { ...updates, lastModified: Date.now() }, // make sure to update lastModified too
      { new: true }
    ).populate("assignedTo", "fullName");

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (updates.status) {
      await logAction(
        req.user.id,
        updatedTask._id,
        updates.boardId,
        "moved",
        `${updatedTask.title?.trim().toUpperCase()} task is moved to ${updatedTask.status
        }!`
      );
    } else if (updates.assignedTo) {
      await logAction(
        req.user.id,
        updatedTask._id,
        updates.boardId,
        "assigned",
        `${updatedTask.title?.trim().toUpperCase()} task is reassigned to ${updatedTask.assignedTo.fullName
        } !`
      );
    }
    io.to(updatedTask.boardId.toString()).emit("task:statusupdate", { updatedTask });
    io.emit("recentActions", updatedTask);
    return res.status(200).json(updatedTask);
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Store task data before deletion
    const deletedTask = task.toObject();

    await Task.findByIdAndDelete(id);
    await Board.findByIdAndUpdate(task.boardId, {
      $pull: { tasks: task._id },
    });

    // Log the action
    await logAction(
      req.user.id,
      task._id,
      task.boardId,
      "deleted",
      `${task.title.toUpperCase()} task is deleted !`
    );

    io.to(task.boardId.toString()).emit("task:delete", { _id: id });
    io.emit("recentActions", id);

    return res.status(200).json({
      message: "Task deleted successfully",
      task: deletedTask,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const getTasksByBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const tasks = await Task.find({ boardId }).populate(
      "assignedTo",
      "fullName"
    );
    return res.status(200).json(tasks);
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const getSmartAssignedUser = async (req, res) => {
  const { boardId } = req.params;

  try {
    const board = await Board.findById(boardId).populate(
      "members",
      "-password"
    );
    if (!board) return res.status(404).json({ message: "Board not found" });

    const activeTaskCounts = await Task.aggregate([
      {
        $match: {
          boardId: new mongoose.Types.ObjectId(boardId),
          status: { $in: ["todo", "in-progress"] },
          assignedTo: { $in: board.members.map((m) => m._id) },
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          count: { $sum: 1 },
        },
      },
    ]);

    // Create a Map of userId -> count
    const taskCountMap = new Map(
      board.members.map((user) => [user._id.toString(), 0])
    );

    activeTaskCounts.forEach(({ _id, count }) => {
      taskCountMap.set(_id.toString(), count);
    });

    // Find user with the fewest tasks
    const leastBusy = [...taskCountMap.entries()].sort(
      (a, b) => a[1] - b[1]
    )[0];
    const leastBusyUser = board.members.find(
      (user) => user._id.toString() === leastBusy[0]
    );

    res.status(200).json(leastBusyUser);
  } catch (error) {
    console.error("Smart assign failed:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const lockTask = async (req,res)=>{
 try{
   const { id } = req.params;
   const userId = req.user.id;

   const task = await Task.findById(id);

   if(!task) return res.status(404).json({success:false,message:"Task not found"});

   // clear expired lock
   if (
     task.lockExpiresAt &&
     task.lockExpiresAt < new Date()
   ) {
     task.lockedBy = null;
     task.lockExpiresAt = null;
     console.log("Lock got expired!");
   }

   // already locked
   if (
     task.lockedBy &&
     task.lockedBy.toString() !== userId.toString()
    ) {
    console.log("Condition: ",task.lockedBy," 2. : ",task.lockedBy.toString()," 3. ",userId.toString());
    console.log("Already Locked!");
     return res.status(409).json({
       success:false,
       message:"This task is currently being edited by another user."
     });
   }else{
    console.log("Not Locked!");
   }

   task.lockedBy = userId;
   task.lockExpiresAt = new Date(Date.now()+300000);

   await task.save();

   io.to(task.boardId.toString()).emit("task:locked", {
      taskId:id,
      userId
   });

   res.json(task);

 }catch(error){
   res.status(500).json({success:true,message:error.message});
 }
};

export const unlockTask = async (req,res)=>{
 try{
   const { id } = req.params;
   const userId = req.user.id;

   const task = await Task.findOneAndUpdate(
     {
       _id:id,
       lockedBy:userId
     },
     {
       lockedBy:null,
       lockExpiresAt:null
     },
     { new:true }
   );

   if(task){
     io.to(task.boardId.toString()).emit("task:unlocked", {
       taskId:id
     });
   }

   res.json({message:"Unlocked"});

 }catch(error){
   res.status(500).json({message:error.message});
 }
};