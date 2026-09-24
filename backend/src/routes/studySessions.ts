import { Router } from "express";
import {
  listStudySessions,
  createStudySession,
  deleteStudySession,
} from "../controllers/studySessionController";
import { authenticate } from "../middleware/auth";
import { requireSubscription } from "../middleware/subscription";

const router = Router();

router.use(authenticate);
router.use(requireSubscription);

router.get("/study-sessions", listStudySessions);
router.post("/study-sessions", createStudySession);
router.delete("/study-sessions/:id", deleteStudySession);

export default router;