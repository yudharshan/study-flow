import { Router } from "express";
import {
  listReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} from "../controllers/reminderController";
import { authenticate } from "../middleware/auth";
import { requireSubscription } from "../middleware/subscription";

const router = Router();

router.use(authenticate);
router.use(requireSubscription);

router.get("/reminders", listReminders);
router.post("/reminders", createReminder);
router.put("/reminders/:id", updateReminder);
router.delete("/reminders/:id", deleteReminder);

export default router;