import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import subjectsRouter from "./routes/subjects";
import tasksRouter from "./routes/tasks";
import plannerSessionsRouter from "./routes/plannerSessions";
import studySessionsRouter from "./routes/studySessions";
import progressRouter from "./routes/progress";
import remindersRouter from "./routes/reminders";
import analyticsRouter from "./routes/analytics";
import razorpayRouter from "./routes/razorpay";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://study-flow-ruddy.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", authRouter);
app.use("/api", subjectsRouter);
app.use("/api", tasksRouter);
app.use("/api", plannerSessionsRouter);
app.use("/api", studySessionsRouter);
app.use("/api", progressRouter);
app.use("/api", remindersRouter);
app.use("/api", analyticsRouter);
app.use("/api/razorpay", razorpayRouter);

app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`Study Flow API running on http://localhost:${PORT}`);
});

export default app;
