/**
 * storyController.js
 * Orchestrates the full MythosAI pipeline for POST /api/generate-story
 *
 * Pipeline:
 *   1. Validate input premise
 *   2. Break premise into scenes        (LLM or mock)
 *   3. For each scene, sequentially:
 *        a. Generate shot list           (LLM or mock)
 *        b. Enrich with multimodal ONLY for scene 1
 *           (avoids 429 quota burst — remaining scenes get empty assets)
 *   4. Return enriched StoryOutput JSON
 */

import { v4 as uuidv4 } from "uuid";
import { breakIntoScenes } from "../services/sceneBreaker.js";
import { generateShotList } from "../services/shotListGenerator.js";
import { enrichSceneWithMultimodal } from "../services/multimodalClient.js";

// ── Validation ────────────────────────────────────────────────────────────────

function validatePremise(premise) {
  if (!premise || typeof premise !== "string") {
    const err = new Error("Field 'premise' is required and must be a string.");
    err.status = 400;
    throw err;
  }
  const trimmed = premise.trim();
  if (trimmed.length < 20) {
    const err = new Error("Premise is too short — please provide at least 20 characters.");
    err.status = 400;
    throw err;
  }
  if (trimmed.length > 4000) {
    const err = new Error("Premise exceeds 4,000 characters. Please shorten your input.");
    err.status = 400;
    throw err;
  }
  return trimmed;
}

// ── Derive a story title from the premise ─────────────────────────────────────

function deriveTitle(premise) {
  // Take the first 6 words of the premise as a working title
  const words = premise.split(/\s+/).slice(0, 6).join(" ");
  return words.endsWith(".") ? words.slice(0, -1) : words;
}

// ── Controller ────────────────────────────────────────────────────────────────

/**
 * POST /api/generate-story
 * @param {import("express").Request}  req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export async function generateStory(req, res, next) {
  try {
    const premise = validatePremise(req.body.premise);

    console.log(`[storyController] Generating story for premise: "${premise.slice(0, 80)}..."`);

    // ── Step 1: Scene breakdown ──────────────────────────────────────────────
    const scenes = await breakIntoScenes(premise);
    console.log(`[storyController] ${scenes.length} scenes broken down.`);

    // ── Step 2: Sequential enrichment per scene ─────────────────────────────
    // Process one scene at a time to avoid bursting the Gemini quota (429).
    // Multimodal assets (image + audio) are only generated for scene 1;
    // remaining scenes receive null assets so the dashboard still renders.
    const enrichedScenes = [];
    for (const scene of scenes) {
      const isFirst = scene.sceneNumber === 1;

      const shots = await generateShotList(scene).catch((err) => {
        console.error(`[storyController] Shot list failed for scene ${scene.sceneNumber}:`, err.message);
        return [];
      });

      const assets = isFirst
        ? await enrichSceneWithMultimodal(scene, shots).catch((err) => {
            console.error(`[storyController] Multimodal failed for scene 1:`, err.message);
            return { image: null, audio: null };
          })
        : { image: null, audio: null };

      enrichedScenes.push({ scene, shots, assets });
    }

    // ── Step 3: Build response ───────────────────────────────────────────────
    /** @type {import("../services/types.js").StoryOutput} */
    const storyOutput = {
      storyId: uuidv4(),
      title: deriveTitle(premise),
      premise,
      scenes: enrichedScenes,
      generatedAt: new Date().toISOString(),
    };

    console.log(`[storyController] Story ${storyOutput.storyId} ready.`);
    return res.status(200).json(storyOutput);
  } catch (err) {
    next(err);
  }
}
