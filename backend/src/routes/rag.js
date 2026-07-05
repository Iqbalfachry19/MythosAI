import { Router } from "express";
import { ingest, ingestFromUrl, ingestBatch, search } from "../controllers/ragController.js";

export const router = Router();

/**
 * POST /api/rag/ingest
 * Index a single media asset with an explicit descriptor.
 * Body: { mediaType, label, description, url?, metadata? }
 * If url is provided but description is omitted, auto-resolution fires.
 */
router.post("/rag/ingest", ingest);

/**
 * POST /api/rag/ingest-url
 * Index from a public URL — auto-detects type and generates description.
 * Supports: YouTube links, image URLs (.jpg/.png/…), audio URLs (.mp3/.wav/…)
 * Body: { url, label?, description?, mediaType?, metadata? }
 */
router.post("/rag/ingest-url", ingestFromUrl);

/**
 * POST /api/rag/ingest-batch
 * Index multiple assets in one request (max 100).
 * Each item may be URL-only — auto-resolution fires when description is absent.
 * Body: { assets: [ { url } | { mediaType, label, description, url?, metadata? }, ... ] }
 */
router.post("/rag/ingest-batch", ingestBatch);

/**
 * POST /api/rag/search
 * Semantic similarity search across all indexed media.
 * Body: { query, topK?, mediaType? }
 * Returns results ranked by cosine similarity (highest first).
 */
router.post("/rag/search", search);
