import { Router } from "express";
import { getAllUsers, getCurrentUser, signin, signout, Signup, updateProfile } from "./auth.controller.js";
import {  isAuthenticated } from "../../middlewares/auth.js";

const router = Router();

// Routes
router.post("/signup", Signup);
router.post("/signin",  signin);
router.get("/user",  isAuthenticated, getCurrentUser);
router.get("/allusers",  isAuthenticated, getAllUsers);
router.post("/logout", isAuthenticated, signout);
router.put("/update-profile", isAuthenticated, updateProfile);

export default router;
