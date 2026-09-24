import { Router } from "express";
import { getProgress } from "../controllers/progressController";
import { authenticate } from "../middleware/auth";
import { requireSubscription } from "../middleware/subscription";

const router = Router();

router.use(authenticate);
router.use(requireSubscription);

router.get("/progress", getProgress);

export default router;