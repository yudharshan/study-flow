import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import healthRouter from "./routes/health";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use("/api", healthRouter);

app.listen(PORT, () => {
  console.log(`Study Flow API running on http://localhost:${PORT}`);
});

export default app;
