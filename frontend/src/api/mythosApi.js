import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  timeout: 120_000, // 2 min — multimodal generation can be slow
  headers: { "Content-Type": "application/json" },
});

/**
 * Submit a story premise and get back the full enriched StoryOutput.
 * @param {string} premise
 */
export async function generateStory(premise) {
  const response = await client.post("/generate-story", { premise });
  return response.data;
}

// ── Multimodal RAG ────────────────────────────────────────────────────────────

/**
 * Ingest a single asset from a public URL (YouTube / image / audio).
 * The backend auto-detects type and generates a description.
 * @param {{ url: string, label?: string, description?: string, mediaType?: string, metadata?: object }} payload
 */
export async function ragIngestUrl(payload) {
  const response = await client.post("/rag/ingest-url", payload);
  return response.data;
}

/**
 * Ingest a single asset with a manual descriptor.
 * @param {{ mediaType: string, label: string, description: string, url?: string, metadata?: object }} payload
 */
export async function ragIngest(payload) {
  const response = await client.post("/rag/ingest", payload);
  return response.data;
}

/**
 * Semantic similarity search. Returns results ranked by score (highest first).
 * @param {{ query: string, topK?: number, mediaType?: string|null }} payload
 */
export async function ragSearch(payload) {
  const response = await client.post("/rag/search", payload);
  return response.data;
}

/**
 * Download story as Markdown file.
 * @param {object} storyData
 */
export async function downloadMarkdown(storyData) {
  const response = await client.post(
    "/export/markdown",
    { storyData },
    { responseType: "blob" }
  );
  const url = URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mythosai-${storyData.storyId}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download story as PDF file.
 * @param {object} storyData
 */
export async function downloadPdf(storyData) {
  const response = await client.post(
    "/export/pdf",
    { storyData },
    { responseType: "blob" }
  );
  const url = URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mythosai-${storyData.storyId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
