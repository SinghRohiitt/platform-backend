import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.js";
import z from "zod";
import prisma from "../../config/prisma.js";
const projectSchema = z.object({
  title: z.string().min(3, "Project title must be at least 3 characters long"),
  description: z.string().optional(),
});

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: parsed.error.issues });
    }
    const project = await prisma.project.create({
      data: {
        ...parsed.data,
        ownerId: req.user!.userId,
      },
    });
    return res.status(201).json({ message: "Project created", project });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.project.count(),
    ]);

    res.json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      projects,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};


// ✅ Get Single Project
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const parsed = projectSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.issues });
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: parsed.data,
    });

    res.json({ success: true, project: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// ✅ Delete Project (with ownership check)
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    await prisma.project.delete({ where: { id } });

    res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};


export const assignUsersToProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // Project ID
    const { userIds } = req.body; // Array of user IDs

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds must be an array" });
    }

    const assignments = userIds.map((userId) => ({
      projectId: id,
      userId,
    }));

    await prisma.projectMember.createMany({
      data: assignments,
      skipDuplicates: true, // prevents errors if already assigned
    });

    return res.json({ message: "Users assigned to project successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getProjectMember = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params; // ✅ Should match route naming

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: true, // ✅ Fetch actual user details (id, name, email)
      },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ✅ Combine owner + member list
    const response = [
      {
        id: project.owner.id,
        name: project.owner.name,
        email: project.owner.email,
        role: "Owner",
      },
      ...members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role || "Member",
      })),
    ];

    return res.json({ members: response });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
