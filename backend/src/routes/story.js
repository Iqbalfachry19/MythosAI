import { Router } from "express";
import { generateStory } from "../controllers/storyController.js";

export const router = Router();

/**
 * POST /api/generate-story
 * Body: { premise: string }
 * Returns: { storyId, title, scenes: Scene[] }
 */
router.post("/generate-story", generateStory);
