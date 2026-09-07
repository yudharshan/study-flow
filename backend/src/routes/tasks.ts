import { Router } from "express";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/tasks", listTasks);
router.post("/tasks", createTask);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);

export default router;