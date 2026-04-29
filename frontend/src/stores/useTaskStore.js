import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "sonner";
import { useBoardStore } from "./useBoardStore";
// import { io } from "socket.io-client";

export const useTaskStore = create((set, get) => ({
  activeTasks: [],
  todoTasks: [],
  completedTasks: [],
  isCreatingTask: false,
  isUpdatingTask: false,
  draggingTask: null,
  isSmartAssigning: false,
  assignedUser: "",
  setAssignedUser: (value) => {
    set({ assignedUser: "" })
  },
  setDraggingTask: (value) => {
    set({ draggingTask: value })
  },

  setTasks: async () => {
    const selectedBoard = useBoardStore.getState().selectedBoard;

    if (!selectedBoard || !selectedBoard._id) {
      toast.error("No board selected");
      return;
    }

    // console.log("Selected board: ",selectedBoard);
    try {
      const res = await axiosInstance.get(`/tasks/board/${selectedBoard._id}`);
      // console.log("Response from setTasks: ", res.data);
      const tasks = res.data;

      // console.log("Fetched tasks:", tasks);

      const active = tasks.filter((task) => task.status === "in-progress");
      const todo = tasks.filter((task) => task.status === "todo");
      const completed = tasks.filter((task) => task.status === "done");

      set({
        activeTasks: active,
        todoTasks: todo,
        completedTasks: completed,
      });

    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error(error?.response?.data?.message || "Failed to load tasks");
    }
  },

  createTask: async (data) => {
    try {
      set({ isCreatingTask: true });
      const res = await axiosInstance.post("/tasks", data);
      await get().setTasks();
      toast.success("Task created Sussceesfully");
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isCreatingTask: false });
    }
  },
  changeStatus: async (data, id) => {
    try {
      const res = await axiosInstance.patch(`/tasks/${id}`, data);
      await get().setTasks();
      toast.success("Task Status changed Sussceesfully");

    } catch (error) {
      console.log("Error occured in hangeStatus", error);
      toast.error(error.response.data.message);
    }
  },
  smartAssignUser: async (boardId) => {
    try {
      set({ isSmartAssigning: true });
      const res = await axiosInstance.get(`/tasks/${boardId}/smart-assign`);
      const assigned = res.data;
      // console.log("Response from smart assigned : ",res.data);
      set({ assignedUser: res.data });
      toast.success(`${res.data.fullName} is assigned to the tasks`);
      return assigned;
    } catch (error) {
      console.log("Error occured in smart assigning : ", error);
      toast.error(error.response.data.message);
      return null;
    } finally {
      set({ isSmartAssigning: false });
    }
  },
  updateTask: async (data, id) => {
    try {

      // console.log("Input to update :",data);
      set({ isUpdatingTask: true });
      const res = await axiosInstance.put(`/tasks/${id}`, data);
      // console.log("Response from update :",res.data);
      await get().setTasks();
      toast.success("Successfully updated the task !");
    } catch (error) {
      console.log("Error occured in updating : ", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingTask: false });
    }
  },
  removeTask: async (id) => {
    try {
      const res = await axiosInstance.delete(`/tasks/${id}`)
      // console.log("Response from removeTask : ",res.data);
      await get().setTasks();
      toast.success("Successfully deleted the task!" || res.data.message);
    } catch (error) {
      console.log("error occured in deleting the task : ", error);
      toast.error(error.response.data.message);
    }
  },
  lockTask: async (taskId) => {
    try {
      await axiosInstance.post(`/tasks/${taskId}/lock`);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Task is locked by another user");
      return false;
    }
  },

  unlockTask: async (taskId) => {
    try {
      await axiosInstance.post(`/tasks/${taskId}/unlock`);
      await get().setTasks();
    } catch (error) {
      console.log("Unlock error:", error);
      toast.error(error.response?.data?.message || "Task is locked by another user");
    }
  },
}));
