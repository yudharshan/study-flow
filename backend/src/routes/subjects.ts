import { Router } from "express";
import {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/subjects", listSubjects);
router.post("/subjects", createSubject);
router.put("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);

export default router;