import { Response } from "express";
import prisma from "../../config/prisma.js";
import { AuthRequest } from "../../middlewares/auth.js";
import z from "zod";
export const createTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  projectId: z.string().uuid("Invalid projectId"),
  assignedTo: z
  .string()
  .uuid("Invalid userId")
  .or(z.literal("")) // allow empty string
  .nullable()        // allow null
  .optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.enum(["PENDING", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assignedTo: z.string().uuid("Invalid assigned userId").optional(),
});

// Create Task
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const data = parsed.data;

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        projectId: data.projectId,

        // ✅ Assign user only if provided, else null
        assignedTo:
          data.assignedTo && data.assignedTo !== "" ? data.assignedTo : null,

        createdBy: req.user!.userId, // ✅ JWT se
      },
    });

    return res.status(201).json({ message: "Task created", task });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get All Tasks (with pagination)
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const tasks = await prisma.task.findMany({
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: { project: true, assigned: true, creator: true },
    });

    const total = await prisma.task.count();

    return res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      tasks,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get Single Task
export const getTaskById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true, assigned: true, creator: true },
    });

    if (!task) return res.status(404).json({ message: "Task not found" });

    return res.json(task);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update Task
export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const { id } = req.params;

    const task = await prisma.task.update({
      where: { id },
      data: parsed.data,
    });

    return res.json({ message: "Task updated", task });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Task
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.task.delete({ where: { id } });

    return res.json({ message: "Task deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
