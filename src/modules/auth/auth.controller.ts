import { Response, Request } from "express";
import prisma from "../../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../../middlewares/auth.js";
// import { emailQueue } from "../../queue/emailQueue.js";
import dotenv from "dotenv";
dotenv.config();
export const Signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashpassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashpassword,
        role: role || "USER",
      },
    });
    const token = jwt.sign({ email }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
    const verifyUrl = `http://localhost:5173/verify?token=${token}`;

    // await emailQueue.add("send-email", { email, verifyUrl });
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // MUST BE FALSE on HTTP
      sameSite: "lax", // works perfectly on HTTP
     
        path: "/", 
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        ProjectMember: {
          select: {
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return res.json({ users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const signout = (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
  });
  res.status(200).json({ message: "Logout successful" });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { name, email, image } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // ==========================
    // 1️⃣ EMAIL VALIDATION
    // ==========================
    if (email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists && emailExists.id !== userId) {
        return res.status(400).json({
          message: "Email already in use by another user",
        });
      }
    }

    // ==========================
    // 2️⃣ UPDATE USER PROFILE
    // ==========================
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        email: email || undefined,
        image: image || undefined, // Store Cloudinary/S3 URL
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    return res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const userLength = async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();

    return res.status(200).json({
      success: true,
      totalUsers: userCount,
    });
  } catch (error) {
    console.error("User Count Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
