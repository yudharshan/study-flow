import { Router } from "express";
import { recordDemoPurchase } from "../controllers/analyticsController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.post("/demo-purchase", recordDemoPurchase);

export default router;