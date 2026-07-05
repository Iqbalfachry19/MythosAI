import { Router } from "express";
import { exportPdf, exportMarkdown } from "../controllers/exportController.js";

export const router = Router();

/**
 * POST /api/export/pdf
 * POST /api/export/markdown
 * Body: { storyData: StoryOutput }
 */
router.post("/export/pdf", exportPdf);
router.post("/export/markdown", exportMarkdown);
