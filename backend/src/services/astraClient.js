/**
 * astraClient.js
 * Singleton AstraDB client + lazy collection initialiser.
 *
 * Collection schema:
 *   _id          : uuid (string)
 *   mediaType    : "image" | "audio" | "video"
 *   label        : human-readable name / filename
 *   description  : text description used for embedding
 *   url          : original file URL or data-URI (optional)
 *   metadata     : arbitrary key-value object
 *   $vector      : 768-dim embedding (text-embedding-004)
 *   createdAt    : ISO timestamp
 */

import { DataAPIClient } from "@datastax/astra-db-ts";

const ASTRA_TOKEN    = process.env.ASTRA_DB_APPLICATION_TOKEN;
const ASTRA_ENDPOINT = process.env.ASTRA_DB_API_ENDPOINT;
const COLLECTION     = process.env.ASTRA_DB_COLLECTION || "media_assets";

// Dimension matches Google gemini-embedding-001 output (pinned via outputDimensionality)
const VECTOR_DIM = 768;

const VECTOR_OPTIONS = {
  vector: {
    dimension: VECTOR_DIM,
    metric: "cosine",
  },
};

let _db         = null;
let _collection = null;

function getDb() {
  if (!_db) {
    const client = new DataAPIClient(ASTRA_TOKEN);
    _db = client.db(ASTRA_ENDPOINT);
  }
  return _db;
}

/**
 * Returns (and lazily initialises) the AstraDB collection handle.
 *
 * Strategy:
 *  1. Return the cached handle immediately after first successful init.
 *  2. On cold start, call createCollection — it is a no-op when the
 *     collection already exists with identical vector options.
 *  3. If createCollection fails because the collection exists with
 *     DIFFERENT options (e.g. no vector index), drop it and recreate.
 *
 * @returns {Promise<import("@datastax/astra-db-ts").Collection>}
 */
export async function getCollection() {
  if (_collection) return _collection;

  if (!ASTRA_TOKEN || ASTRA_TOKEN.startsWith("AstraCS:...")) {
    throw new Error(
      "ASTRA_DB_APPLICATION_TOKEN is not configured. " +
        "Add it to your .env file to enable multimodal RAG."
    );
  }
  if (!ASTRA_ENDPOINT || ASTRA_ENDPOINT.includes("<db-id>")) {
    throw new Error(
      "ASTRA_DB_API_ENDPOINT is not configured. " +
        "Add it to your .env file to enable multimodal RAG."
    );
  }

  const db = getDb();

  try {
    // createCollection is idempotent when options match — fast path for a
    // collection that already exists with the correct vector config.
    _collection = await db.createCollection(COLLECTION, VECTOR_OPTIONS);
    console.log(`[astraClient] Ready: collection "${COLLECTION}" (dim=${VECTOR_DIM})`);
  } catch (err) {
    const msg = err?.message ?? "";

    // The collection exists but was created without a vector index
    // (e.g. created manually or before vector config was added).
    // Drop it and recreate with the correct schema.
    if (
      msg.includes("already exists") ||
      msg.includes("EXISTING_COLLECTION_DIFFERENT_OPTIONS") ||
      err?.errorCode === "EXISTING_COLLECTION_DIFFERENT_OPTIONS"
    ) {
      console.warn(
        `[astraClient] Collection "${COLLECTION}" exists with incompatible options — dropping and recreating…`
      );
      await db.dropCollection(COLLECTION);
      _collection = await db.createCollection(COLLECTION, VECTOR_OPTIONS);
      console.log(`[astraClient] Recreated collection "${COLLECTION}" (dim=${VECTOR_DIM})`);
    } else {
      _collection = null; // allow retry on next request
      throw err;
    }
  }

  return _collection;
}

/**
 * Insert a single media asset document (with pre-computed vector).
 *
 * @param {{ id: string, mediaType: string, label: string, description: string, url?: string, metadata?: object, vector: number[] }} doc
 */
export async function insertMediaAsset(doc) {
  const col = await getCollection();
  await col.insertOne({
    _id: doc.id,
    mediaType: doc.mediaType,
    label: doc.label,
    description: doc.description,
    url: doc.url ?? null,
    metadata: doc.metadata ?? {},
    $vector: doc.vector,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Vector-similarity search.
 *
 * @param {number[]} queryVector   768-dim embedding of the user query
 * @param {number}   topK          number of results to return (default 5)
 * @param {"image"|"audio"|"video"|null} filterType  optional mediaType filter
 * @returns {Promise<Array<{doc: object, score: number}>>}
 */
export async function searchSimilar(queryVector, topK = 5, filterType = null) {
  const col = await getCollection();
  const filter = filterType ? { mediaType: filterType } : {};

  const cursor = col.find(filter, {
    sort: { $vector: queryVector },
    limit: topK,
    includeSimilarity: true,
  });

  const results = [];
  for await (const doc of cursor) {
    results.push({ doc, score: doc.$similarity ?? 0 });
  }
  return results;
}
