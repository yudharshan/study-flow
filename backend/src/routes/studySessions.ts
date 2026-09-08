import { Router } from "express";
import {
  listStudySessions,
  createStudySession,
  deleteStudySession,
} from "../controllers/studySessionController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/study-sessions", listStudySessions);
router.post("/study-sessions", createStudySession);
router.delete("/study-sessions/:id", deleteStudySession);

export default router;