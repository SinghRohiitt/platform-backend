import { Router } from "express";
import { signin, Signup } from "./auth.controller.js";
import { authorizeRoles, isAuthenticated } from "../../middlewares/auth.js";

const router = Router();

// Routes
router.post("/signup", Signup);
router.post("/signin",  signin);

export default router;
