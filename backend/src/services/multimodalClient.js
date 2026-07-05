/**
 * multimodalClient.js
 * Handles all external multimodal API calls:
 *   • @google/genai interactions.create → Text-to-Image  (model: gemini-3.1-flash-image)
 *   • @google/genai interactions.create → Text-to-Audio  (model: lyria-3-clip-preview)
 *
 * Both use the same pattern:
 *   const interaction = await ai.interactions.create({ model, input });
 *   interaction.output_image.data  // base64 PNG
 *   interaction.output_audio.data  // base64 MP3
 *   interaction.output_text        // lyrics / description (optional)
 */

import { GoogleGenAI } from "@google/genai";

// ── @google/genai client ──────────────────────────────────────────────────────

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const HAS_GEMINI = GEMINI_KEY && !GEMINI_KEY.startsWith("AIza...");

const ai = HAS_GEMINI ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

const TIMEOUT_MS = Number(process.env.EXTERNAL_API_TIMEOUT) || 60_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function safeCall(fn, label) {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    const msg =
      err.code === "ECONNABORTED"
        ? `${label} timed out after ${TIMEOUT_MS}ms`
        : `${label} error: ${err.message}`;
    console.error(`[multimodalClient] ${msg}`);
    return { ok: false, error: msg };
  }
}

// ── Text-to-Image via @google/genai interactions ──────────────────────────────

/**
 * @param {string} imagePrompt
 * @returns {Promise<import("./types.js").ImageResult>}
 */
export async function generateStoryboardImage(imagePrompt) {
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";

  if (!HAS_GEMINI) {
    return {
      success: false,
      dataUri: null,
      model,
      error: "GEMINI_API_KEY not configured — storyboard image skipped.",
    };
  }

  const result = await safeCall(async () => {
    const interaction = await ai.interactions.create({
      model,
      input: imagePrompt,
    });

    const generatedImage = interaction.output_image;
    if (!generatedImage?.data) {
      throw new Error("Gemini returned no image data in interaction output.");
    }

    return `data:image/png;base64,${generatedImage.data}`;
  }, "Text-to-Image (Gemini)");

  if (!result.ok) {
    return { success: false, dataUri: null, model, error: result.error };
  }

  return { success: true, dataUri: result.data, model, error: null };
}

// ── Text-to-Audio via @google/genai Lyria 3 ──────────────────────────────────

/**
 * @param {string} audioMoodPrompt
 * @returns {Promise<import("./types.js").AudioResult>}
 */
export async function generateAudioMood(audioMoodPrompt) {
  const model = process.env.GEMINI_AUDIO_MODEL || "lyria-3-clip-preview";

  if (!HAS_GEMINI) {
    return {
      success: false,
      dataUri: null,
      model,
      error: "GEMINI_API_KEY not configured — audio mood skipped.",
    };
  }

  const result = await safeCall(async () => {
    const interaction = await ai.interactions.create({
      model,
      input: audioMoodPrompt,
    });

    const generatedAudio = interaction.output_audio;
    if (!generatedAudio?.data) {
      throw new Error("Lyria returned no audio data in interaction output.");
    }

    // output_audio.data is base64 MP3
    return `data:audio/mp3;base64,${generatedAudio.data}`;
  }, "Text-to-Audio (Lyria 3)");

  if (!result.ok) {
    return { success: false, dataUri: null, model, error: result.error };
  }

  return { success: true, dataUri: result.data, model, error: null };
}

// ── Parallel enrichment ───────────────────────────────────────────────────────

/**
 * Enriches a scene with storyboard image + audio mood concurrently.
 * Never throws — each asset has an independent success/error flag.
 *
 * @param {import("./types.js").Scene} scene
 * @param {import("./types.js").Shot[]} shots
 * @returns {Promise<import("./types.js").MultimodalAssets>}
 */
export async function enrichSceneWithMultimodal(scene, shots) {
  const imagePrompt =
    shots?.[0]?.imagePrompt ||
    `Cinematic storyboard frame: ${scene.description}. ${scene.emotionalTone} mood, film still, 16:9.`;

  const audioPrompt = scene.audioMoodPrompt || `${scene.emotionalTone} ambient music`;

  const [imageResult, audioResult] = await Promise.all([
    generateStoryboardImage(imagePrompt),
    generateAudioMood(audioPrompt),
  ]);

  return { image: imageResult, audio: audioResult };
}
