import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  timeout: 120_000, // 2 min — multimodal generation can be slow
  headers: { "Content-Type": "application/json" },
});

/**
 * Submit a story premise and get back the full enriched StoryOutput.
 * @param {string} premise
 * @returns {Promise<import("../types/story.js").StoryOutput>}
 */
export async function generateStory(premise) {
  const response = await client.post("/generate-story", { premise });
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
