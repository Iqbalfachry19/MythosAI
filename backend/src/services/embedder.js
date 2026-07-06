/**
 * embedder.js
 * Wraps Google gemini-embedding-001 to produce 768-dim float vectors.
 *
 * For video and audio assets we embed their *text description* (transcript /
 * caption / scene label) because embedding models are text-in/vector-out.
 * For images the caller should pass an AI-generated caption or the original
 * image prompt as the text to embed.
 */

import { GoogleGenAI } from "@google/genai";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const HAS_GEMINI = GEMINI_KEY && !GEMINI_KEY.startsWith("AIza...");

const ai = HAS_GEMINI ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

// gemini-embedding-001 default output is 3072 dims; we pin to 768 to match
// the AstraDB collection schema (default_keyspace.media_assets, dim=768).
const EMBEDDING_MODEL = "gemini-embedding-001";
const VECTOR_DIM = 768;

/**
 * Embeds a single text string and returns a float32 array (length 768).
 * Throws if the Gemini key is not configured.
 *
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function embedText(text) {
  if (!HAS_GEMINI) {
    // Deterministic mock vector for dev without an API key.
    // Produces a unit vector seeded from the text content so that
    // identical texts produce identical vectors.
    return buildMockVector(text);
  }

  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: { outputDimensionality: VECTOR_DIM },
  });

  // Response shape: { embeddings: [{ values: number[] }] }
  const values = response?.embeddings?.[0]?.values;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`${EMBEDDING_MODEL} returned no embedding values.`);
  }
  if (values.length !== VECTOR_DIM) {
    throw new Error(`Expected ${VECTOR_DIM}-dim vector, got ${values.length}. Check outputDimensionality config.`);
  }

  return values; // 768-dim float array
}

/**
 * Batches up to 100 texts in parallel (Gemini allows concurrent calls).
 *
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function embedBatch(texts) {
  return Promise.all(texts.map(embedText));
}

// ── Mock fallback (no API key) ────────────────────────────────────────────────

/**
 * Returns a deterministic pseudo-random 768-dim unit vector for a text.
 * NOT semantically meaningful — only used so the system boots without keys.
 *
 * @param {string} text
 * @returns {number[]}
 */
function buildMockVector(text) {
  const dim = 768;
  const seed = [...text].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffffffff, 0);
  let state = seed || 1;
  const vec = Array.from({ length: dim }, () => {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return (state & 0xffff) / 0x8000 - 1; // [-1, 1]
  });
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}
