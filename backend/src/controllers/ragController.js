/**
 * ragController.js
 *
 * POST /api/rag/ingest         — index one or more media assets (manual descriptor)
 * POST /api/rag/ingest-url     — index from a public URL (YouTube / image / audio)
 * POST /api/rag/ingest-batch   — bulk index (array of assets or URLs)
 * POST /api/rag/search         — semantic search, returns ranked results
 *
 * All responses follow the shape:
 *   { ok: true,  data: ... }
 *   { ok: false, error: string }
 */

import { ingestMedia, ingestUrl, ingestMediaBatch, searchMedia } from "../services/mediaRag.js";

// ── POST /api/rag/ingest ──────────────────────────────────────────────────────

/**
 * Body:
 *   {
 *     mediaType   : "image" | "audio" | "video",
 *     label       : string,          // e.g. "sunset_timelapse.mp4"
 *     description : string,          // text used for semantic embedding
 *     url?        : string,          // original asset URL or data-URI
 *     metadata?   : object           // duration, resolution, tags, etc.
 *   }
 */
export async function ingest(req, res, next) {
  try {
    const { mediaType, label, description, url, metadata } = req.body;

    if (!mediaType || !label || !description) {
      return res.status(400).json({
        ok: false,
        error: "Fields 'mediaType', 'label', and 'description' are required.",
      });
    }

    const result = await ingestMedia({ mediaType, label, description, url, metadata });

    return res.status(201).json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/rag/ingest-url ──────────────────────────────────────────────────

/**
 * Index a single asset from a public URL with auto-detection.
 *
 * Body:
 *   {
 *     url         : string,   // required — YouTube / image URL / audio URL
 *     label?      : string,   // optional override for the asset name
 *     description?: string,   // optional override (skips auto-captioning)
 *     mediaType?  : string,   // optional override ("image"|"audio"|"video")
 *     metadata?   : object    // extra fields merged into stored metadata
 *   }
 *
 * The resolver will:
 *   - YouTube  → title, channel, tags, duration via oEmbed + ytdl-core
 *   - Image    → Gemini Vision auto-caption (if Gemini key present)
 *   - Audio    → Gemini audio description  (if Gemini key present)
 */
export async function ingestFromUrl(req, res, next) {
  try {
    const { url, label, description, mediaType, metadata } = req.body;

    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Field 'url' is required.",
      });
    }

    const result = await ingestUrl(url.trim(), { label, description, mediaType, metadata });

    return res.status(201).json({
      ok: true,
      data: {
        ...result,
        resolvedFrom: url.trim(),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/rag/ingest-batch ────────────────────────────────────────────────

/**
 * Body: { assets: Array<{ mediaType?, label?, description?, url, metadata? }> }
 * Each item may be URL-only — auto-resolution fires for items missing description.
 */
export async function ingestBatch(req, res, next) {
  try {
    const { assets } = req.body;

    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Body must contain a non-empty 'assets' array.",
      });
    }
    if (assets.length > 100) {
      return res.status(400).json({
        ok: false,
        error: "Batch size limit is 100 assets per request.",
      });
    }

    // Items with only a url and no description are handled by ingestMedia's auto-resolve
    const results = await ingestMediaBatch(assets);

    return res.status(201).json({
      ok: true,
      data: {
        indexed: results.length,
        assets: results,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/rag/search ──────────────────────────────────────────────────────

/**
 * Body:
 *   {
 *     query     : string,                             // user query
 *     topK?     : number,                             // default 5, max 20
 *     mediaType?: "image" | "audio" | "video" | null  // optional type filter
 *   }
 *
 * Response data shape:
 *   {
 *     query      : string,
 *     totalFound : number,
 *     results: [
 *       {
 *         rank            : number,    // 1-based rank (1 = most similar)
 *         id              : string,
 *         mediaType       : string,
 *         label           : string,
 *         description     : string,
 *         url             : string | null,
 *         metadata        : object,
 *         createdAt       : string,
 *         similarityScore : number,    // cosine similarity [0, 1]
 *         similarityPct   : string,    // e.g. "94.32%"
 *       },
 *       ...
 *     ]
 *   }
 */
export async function search(req, res, next) {
  try {
    const { query, topK: rawTopK, mediaType } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Field 'query' is required and must be a non-empty string.",
      });
    }

    const topK = Math.min(Math.max(parseInt(rawTopK, 10) || 5, 1), 20);
    const filter = ["image", "audio", "video"].includes(mediaType) ? mediaType : null;

    const rawResults = await searchMedia(query.trim(), { topK, mediaType: filter });

    // Annotate with rank and human-readable percentage
    const results = rawResults.map((r, idx) => ({
      rank: idx + 1,
      ...r,
      similarityPct: (r.similarityScore * 100).toFixed(2) + "%",
    }));

    return res.status(200).json({
      ok: true,
      data: {
        query: query.trim(),
        mediaTypeFilter: filter ?? "all",
        topK,
        totalFound: results.length,
        results,
      },
    });
  } catch (err) {
    next(err);
  }
}
