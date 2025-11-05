import { Router } from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  assignUsersToProject,
} from "./project.controller.js";
import { isAuthenticated,authorizeRoles } from "../../middlewares/auth.js";

const Projectrouter = Router();

// ✅ Routes
Projectrouter.post("/", isAuthenticated, createProject);
Projectrouter.get("/", isAuthenticated,  getProjects);
Projectrouter.get("/:id", isAuthenticated, getProjectById);
Projectrouter.put("/:id", isAuthenticated, updateProject);
Projectrouter.delete("/:id", isAuthenticated, deleteProject);
Projectrouter.post("/:id/assign", isAuthenticated, assignUsersToProject);
export default Projectrouter;
