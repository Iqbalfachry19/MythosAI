/**
 * mediaRag.js
 * High-level RAG operations for multimodal assets:
 *
 *  ingestMedia(asset)  — embed + store one asset in AstraDB
 *  ingestUrl(url, overrides) — resolve a public URL then ingest automatically
 *  searchMedia(query, opts)  — embed query + vector-search + rank results
 *
 * Supported mediaTypes: "image" | "audio" | "video"
 *
 * Embedding strategy:
 *   - Image  → embed Gemini Vision caption (or provided description)
 *   - Audio  → embed Gemini audio description (or provided description)
 *   - Video  → embed YouTube metadata + description (or provided description)
 *
 * Similarity score is a cosine value in [0, 1].
 * Results are returned sorted descending by score (most similar first).
 */

import { v4 as uuidv4 } from "uuid";
import { embedText } from "./embedder.js";
import { insertMediaAsset, searchSimilar } from "./astraClient.js";
import { resolveUrl } from "./urlResolver.js";

// ── Ingest ────────────────────────────────────────────────────────────────────

/**
 * Ingests a media asset into AstraDB by:
 *   1. Building an embedding text from the asset descriptor
 *   2. Calling text-embedding-004 to get a 768-dim vector
 *   3. Storing the document + vector in AstraDB
 *
 * @param {object} asset
 * @param {"image"|"audio"|"video"} asset.mediaType
 * @param {string}  asset.label       Human-readable name/filename
 * @param {string}  asset.description Plain-text description used for semantic search
 * @param {string}  [asset.url]       Optional URL / data-URI of the media file
 * @param {object}  [asset.metadata]  Any extra fields (duration, resolution, etc.)
 * @returns {Promise<{ id: string, mediaType: string, label: string }>}
 */
export async function ingestMedia(asset) {
  let { mediaType, label, description, url, metadata } = asset;

  // Auto-resolve URL when description is absent
  if (url && (!description || description.trim().length === 0)) {
    console.log(`[mediaRag] No description provided — resolving URL: ${url}`);
    const resolved = await resolveUrl(url);
    mediaType    = asset.mediaType    || resolved.mediaType;
    label        = asset.label        || resolved.label;
    description  = resolved.description;
    metadata     = { ...resolved.metadata, ...asset.metadata };
  }

  if (!["image", "audio", "video"].includes(mediaType)) {
    throw Object.assign(new Error(`Unsupported mediaType: "${mediaType}". Use image | audio | video.`), { status: 400 });
  }
  if (!description || description.trim().length === 0) {
    throw Object.assign(new Error("'description' is required. Provide it explicitly or pass a 'url' for auto-resolution."), { status: 400 });
  }

  // Build a richer embedding text so the vector carries more signal
  const embeddingText = buildEmbeddingText(mediaType, label, description, metadata);
  const vector = await embedText(embeddingText);

  const id = uuidv4();
  await insertMediaAsset({ id, mediaType, label, description, url, metadata, vector });

  console.log(`[mediaRag] Ingested ${mediaType} "${label}" (id=${id})`);
  return { id, mediaType, label };
}

/**
 * Ingests multiple assets concurrently (max 10 in parallel to respect rate limits).
 *
 * @param {object[]} assets
 * @returns {Promise<Array<{ id: string, mediaType: string, label: string }>>}
 */
export async function ingestMediaBatch(assets) {
  const CONCURRENCY = 10;
  const results = [];
  for (let i = 0; i < assets.length; i += CONCURRENCY) {
    const batch = assets.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(ingestMedia));
    results.push(...batchResults);
  }
  return results;
}

// ── URL-first ingest shortcut ─────────────────────────────────────────────────

/**
 * Convenience wrapper: resolve a public URL then ingest.
 * Caller may pass optional overrides for label / description / metadata.
 *
 * Examples:
 *   ingestUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
 *   ingestUrl("https://example.com/photo.jpg", { label: "My photo" })
 *   ingestUrl("https://cdn.example.com/track.mp3", { metadata: { album: "OST" } })
 *
 * @param {string} url
 * @param {object} [overrides]  label, description, mediaType, metadata
 * @returns {Promise<{ id: string, mediaType: string, label: string, resolvedFrom: string }>}
 */
export async function ingestUrl(url, overrides = {}) {
  if (!url || typeof url !== "string") {
    throw Object.assign(new Error("'url' is required for ingestUrl."), { status: 400 });
  }

  const resolved = await resolveUrl(url.trim());

  // Merge resolved data with caller overrides (overrides win for label/mediaType,
  // but description from the resolver is always used as the semantic anchor unless
  // the caller explicitly provides their own description)
  const merged = {
    mediaType:   overrides.mediaType   || resolved.mediaType,
    label:       overrides.label       || resolved.label,
    description: overrides.description || resolved.description,
    url:         resolved.url,
    metadata:    { ...resolved.metadata, ...(overrides.metadata ?? {}) },
  };

  const result = await ingestMedia(merged);
  return { ...result, resolvedFrom: url };
}

// ── Search ────────────────────────────────────────────────────────────────────

/**
 * Searches AstraDB for media assets semantically similar to `query`.
 * Returns results ranked by cosine similarity (highest first).
 *
 * @param {string} query          User query text
 * @param {object} [opts]
 * @param {number} [opts.topK=5]  Max results to return
 * @param {"image"|"audio"|"video"|null} [opts.mediaType]  Optional type filter
 * @returns {Promise<RagSearchResult[]>}
 */
export async function searchMedia(query, opts = {}) {
  const { topK = 5, mediaType = null } = opts;

  if (!query || query.trim().length === 0) {
    throw Object.assign(new Error("'query' is required for search."), { status: 400 });
  }

  const queryVector = await embedText(query.trim());
  const raw = await searchSimilar(queryVector, topK, mediaType);

  // Map to clean output, stripping internal AstraDB fields
  const results = raw.map(({ doc, score }) => ({
    id: doc._id,
    mediaType: doc.mediaType,
    label: doc.label,
    description: doc.description,
    url: doc.url,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    similarityScore: parseFloat(score.toFixed(6)),
  }));

  // Sort descending by similarity (AstraDB already does this, but be explicit)
  results.sort((a, b) => b.similarityScore - a.similarityScore);

  return results;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Constructs a rich embedding text that includes the media type, label, and
 * any structured metadata so the vector captures more semantic context.
 *
 * @param {string} mediaType
 * @param {string} label
 * @param {string} description
 * @param {object} [metadata]
 * @returns {string}
 */
function buildEmbeddingText(mediaType, label, description, metadata) {
  const metaStr = metadata
    ? Object.entries(metadata)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    : "";

  const parts = [
    `[${mediaType.toUpperCase()}]`,
    label,
    description,
    metaStr,
  ].filter(Boolean);

  return parts.join(" | ");
}

/**
 * @typedef {Object} RagSearchResult
 * @property {string}  id
 * @property {"image"|"audio"|"video"} mediaType
 * @property {string}  label
 * @property {string}  description
 * @property {string|null} url
 * @property {object}  metadata
 * @property {string}  createdAt
 * @property {number}  similarityScore   cosine similarity in [0, 1]
 */
