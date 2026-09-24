import { Router } from "express";
import {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController";
import { authenticate } from "../middleware/auth";
import { requireSubscription } from "../middleware/subscription";

const router = Router();

router.use(authenticate);
router.use(requireSubscription);

router.get("/subjects", listSubjects);
router.post("/subjects", createSubject);
router.put("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);

export default router;