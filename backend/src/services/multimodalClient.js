/**
 * multimodalClient.js
 * Handles all external API calls:
 *   • Hugging Face Inference API → Text-to-Image  (storyboard sketch)
 *   • Hugging Face Inference API → Text-to-Audio  (ambient mood)
 *
 * Both operations are independent and run in parallel.
 * Each call has its own timeout and graceful fallback on failure.
 */

import axios from "axios";

const HF_BASE = "https://api-inference.huggingface.co/models";
const HF_HEADERS = () => ({
  Authorization: `Bearer ${process.env.HF_API_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

const TIMEOUT_MS = Number(process.env.EXTERNAL_API_TIMEOUT) || 30_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert an ArrayBuffer / Buffer to a base64 data URI.
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @returns {string}
 */
function toDataURI(buffer, mimeType) {
  return `data:${mimeType};base64,${Buffer.from(buffer).toString("base64")}`;
}

/**
 * Wraps an axios request with a unified timeout + error label.
 * @template T
 * @param {Promise<T>} promise
 * @param {string} label  e.g. "Text-to-Image"
 * @returns {Promise<{ok: true, data: T} | {ok: false, error: string}>}
 */
async function safeRequest(promise, label) {
  try {
    const data = await promise;
    return { ok: true, data };
  } catch (err) {
    const message =
      err.code === "ECONNABORTED"
        ? `${label} API timed out after ${TIMEOUT_MS}ms`
        : `${label} API error: ${err.response?.status ?? ""} ${err.message}`;
    console.error(`[multimodalClient] ${message}`);
    return { ok: false, error: message };
  }
}

// ── Text-to-Image ─────────────────────────────────────────────────────────────

/**
 * @param {string} imagePrompt  Detailed visual prompt for the storyboard frame.
 * @returns {Promise<import("./types.js").ImageResult>}
 */
export async function generateStoryboardImage(imagePrompt) {
  const model = process.env.HF_IMAGE_MODEL || "stabilityai/stable-diffusion-xl-base-1.0";
  const url = `${HF_BASE}/${model}`;

  const result = await safeRequest(
    axios.post(
      url,
      {
        inputs: imagePrompt,
        parameters: {
          negative_prompt: "blurry, low quality, cartoonish, watermark, text",
          num_inference_steps: 25,
          guidance_scale: 7.5,
          width: 768,
          height: 432, // 16:9 storyboard aspect ratio
        },
      },
      {
        headers: HF_HEADERS(),
        timeout: TIMEOUT_MS,
        responseType: "arraybuffer", // HF returns raw image bytes
      }
    ),
    "Text-to-Image"
  );

  if (!result.ok) {
    return { success: false, error: result.error, dataUri: null, model };
  }

  const dataUri = toDataURI(result.data.data, "image/png");
  return { success: true, dataUri, model, error: null };
}

// ── Text-to-Audio ─────────────────────────────────────────────────────────────

/**
 * @param {string} audioMoodPrompt  Short phrase describing the desired audio mood.
 * @returns {Promise<import("./types.js").AudioResult>}
 */
export async function generateAudioMood(audioMoodPrompt) {
  const model = process.env.HF_AUDIO_MODEL || "facebook/musicgen-small";
  const url = `${HF_BASE}/${model}`;

  const result = await safeRequest(
    axios.post(
      url,
      {
        inputs: audioMoodPrompt,
        parameters: {
          max_new_tokens: 256, // ~5 seconds of audio at 32kHz
        },
      },
      {
        headers: HF_HEADERS(),
        timeout: TIMEOUT_MS,
        responseType: "arraybuffer", // HF returns raw audio bytes
      }
    ),
    "Text-to-Audio"
  );

  if (!result.ok) {
    return { success: false, error: result.error, dataUri: null, model };
  }

  const dataUri = toDataURI(result.data.data, "audio/wav");
  return { success: true, dataUri, model, error: null };
}

// ── Parallel enrichment ───────────────────────────────────────────────────────

/**
 * Enriches a scene with storyboard image + audio mood in a single concurrent call.
 * Never throws — failures are captured in each result's `success` flag.
 *
 * @param {import("./types.js").Scene} scene
 * @param {import("./types.js").Shot[]} shots
 * @returns {Promise<import("./types.js").MultimodalAssets>}
 */
export async function enrichSceneWithMultimodal(scene, shots) {
  // Use the first shot's dedicated image prompt for richer visual accuracy
  const imagePrompt =
    shots?.[0]?.imagePrompt ||
    `Cinematic storyboard frame: ${scene.description}. ${scene.emotionalTone} mood.`;

  const audioPrompt = scene.audioMoodPrompt || `${scene.emotionalTone} ambient music`;

  // Run both requests in parallel — failures are handled independently
  const [imageResult, audioResult] = await Promise.all([
    generateStoryboardImage(imagePrompt),
    generateAudioMood(audioPrompt),
  ]);

  return {
    image: imageResult,
    audio: audioResult,
  };
}
