import { Router } from "express";
import { register, login, me } from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/me", authenticate, me);

export default router;