import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";
import Projectrouter from "./modules/project/project.routes.js";
import TaskRouter from "./modules/task/task.routes.js";
dotenv.config();

const app = express();
app.use(cookieParser());

// Middlewares
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/projects", Projectrouter);
app.use("/api/tasks", TaskRouter);

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running 🚀" });
});

export default app;
