import { Router } from "express";
import { getProgress } from "../controllers/progressController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/progress", getProgress);

export default router;