import express from "express";
import {
  createTask,
  updateTask,
  deleteTask,
  getTasksByBoard,
  getSmartAssignedUser,
  updateTaskStatus,
  lockTask,
  unlockTask,
} from "../controller/task.controller.js";
import {isAuthenticated} from "../middlewares/auth.middleware.js";
import {checkBoardMembership, validateTaskTitle} from "../middlewares/task.middleware.js";

const router = express.Router();

router.get("/board/:boardId", isAuthenticated,getTasksByBoard);
router.post("/",isAuthenticated, validateTaskTitle, checkBoardMembership,createTask);
router.put("/:id",isAuthenticated, validateTaskTitle,checkBoardMembership, updateTask);
router.patch("/:id",isAuthenticated,checkBoardMembership , updateTaskStatus);
router.delete("/:id",isAuthenticated, deleteTask);
router.get("/:boardId/smart-assign",isAuthenticated, getSmartAssignedUser);
router.post("/:id/lock",isAuthenticated,lockTask);
router.post("/:id/unlock",isAuthenticated,unlockTask);
export default router;
