import { Router } from "express";
import { signin, Signup } from "./auth.controller.js";
import { authorizeRoles, isAuthenticated } from "../../middlewares/auth.js";

const router = Router();

// Routes
router.post("/signup", isAuthenticated, Signup);
router.post("/signin", isAuthenticated, authorizeRoles("ADMIN"), signin);

export default router;
