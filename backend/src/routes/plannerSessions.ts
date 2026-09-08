import { Router } from "express";
import {
  listPlannerSessions,
  createPlannerSession,
  updatePlannerSession,
  deletePlannerSession,
} from "../controllers/plannerSessionController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/planner", listPlannerSessions);
router.post("/planner", createPlannerSession);
router.put("/planner/:id", updatePlannerSession);
router.delete("/planner/:id", deletePlannerSession);

export default router;
