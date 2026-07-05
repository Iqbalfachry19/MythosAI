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

// Dimension matches Google text-embedding-004 output (768)
const VECTOR_DIM = 768;

let _collection = null;

/**
 * Returns (and lazily creates) the AstraDB collection.
 * The collection uses cosine similarity for vector search.
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

  const client = new DataAPIClient(ASTRA_TOKEN);
  const db = client.db(ASTRA_ENDPOINT);

  // createCollection is idempotent — safe to call on every startup
  _collection = await db.createCollection(COLLECTION, {
    vector: {
      dimension: VECTOR_DIM,
      metric: "cosine",
    },
  });

  console.log(`[astraClient] Connected to collection "${COLLECTION}" (dim=${VECTOR_DIM})`);
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
