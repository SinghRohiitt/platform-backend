import { Router } from "express";
import {  signin, Signup } from "./auth.controller.js";

const router = Router();

// Routes
router.post("/signup", Signup);
router.post("/signin", signin);

export default router;