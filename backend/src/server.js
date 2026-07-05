import "dotenv/config";
import express from "express";
import cors from "cors";
import { router as storyRouter } from "./routes/story.js";
import { router as exportRouter } from "./routes/export.js";
import { router as ragRouter } from "./routes/rag.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json({ limit: "10mb" })); // increased for base64 media payloads

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api", storyRouter);
app.use("/api", exportRouter);
app.use("/api", ragRouter);

// ── Health check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", service: "MythosAI Backend" }));

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[MythosAI Error]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🎬 MythosAI backend running on http://localhost:${PORT}`);
});
