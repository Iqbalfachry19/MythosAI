import "dotenv/config";
import express from "express";
import cors from "cors";
import { router as storyRouter } from "./routes/story.js";
import { router as exportRouter } from "./routes/export.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json({ limit: "2mb" }));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api", storyRouter);
app.use("/api", exportRouter);

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
