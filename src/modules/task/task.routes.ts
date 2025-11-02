import { Router } from "express";
import {
  createTask,
  getTasks,   
  getTaskById,
  updateTask,
  deleteTask,
} from "./task.controller.js";
import { isAuthenticated } from "../../middlewares/auth.js";

const TaskRouter = Router();

TaskRouter.post("/", isAuthenticated, createTask); // any logged-in user can create
TaskRouter.get("/", isAuthenticated, getTasks);
TaskRouter.get("/:id", isAuthenticated, getTaskById);
TaskRouter.put("/:id", isAuthenticated, updateTask);
TaskRouter.delete("/:id", isAuthenticated, deleteTask);

export default TaskRouter;
