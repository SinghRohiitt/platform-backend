import { Response, Request } from "express";
import prisma from "../../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../../middlewares/auth.js";

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
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
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