/**
 * urlResolver.js
 *
 * Given any public URL, resolves it into a { mediaType, label, description, metadata }
 * object that can be fed directly into ingestMedia().
 *
 * Supported sources:
 *   YouTube    → oEmbed API (no key) + ytdl-core for duration/formats
 *   Image URL  → fetch binary → Gemini Vision generates a caption
 *   Audio URL  → fetch binary (mp3/wav/ogg/flac/m4a) → Gemini generates description
 *
 * For image/audio we stay within Gemini's inline payload limit (20 MB).
 * Anything larger is accepted as metadata-only (description = filename + MIME).
 */

import ytdl from "ytdl-core";
import { GoogleGenAI } from "@google/genai";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const HAS_GEMINI = GEMINI_KEY && !GEMINI_KEY.startsWith("AIza...");
const ai = HAS_GEMINI ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

const VISION_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

// Max binary size we'll forward to Gemini Vision (20 MB)
const MAX_INLINE_BYTES = 20 * 1024 * 1024;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Resolve a public URL into a media descriptor ready for ingest.
 *
 * @param {string} url
 * @returns {Promise<ResolvedMedia>}
 *
 * @typedef {Object} ResolvedMedia
 * @property {"image"|"audio"|"video"} mediaType
 * @property {string} label
 * @property {string} description
 * @property {string} url          same as input
 * @property {object} metadata
 */
export async function resolveUrl(url) {
  const trimmed = url.trim();

  if (isYouTube(trimmed)) return resolveYouTube(trimmed);
  if (isImageUrl(trimmed))  return resolveImage(trimmed);
  if (isAudioUrl(trimmed))  return resolveAudio(trimmed);

  // Fallback: unknown URL — try a HEAD request to sniff Content-Type
  return resolveByContentType(trimmed);
}

// ── YouTube ───────────────────────────────────────────────────────────────────

function isYouTube(url) {
  return /(?:youtube\.com\/(?:watch|shorts|embed)|youtu\.be\/)/.test(url);
}

async function resolveYouTube(url) {
  // 1. YouTube oEmbed — free, no API key, returns title + author
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const oembedResp = await fetch(oembedUrl, { signal: AbortSignal.timeout(10_000) });

  if (!oembedResp.ok) {
    throw Object.assign(
      new Error(`YouTube oEmbed failed (${oembedResp.status}) for: ${url}`),
      { status: 400 }
    );
  }

  const oembed = await oembedResp.json();
  const title = oembed.title ?? "Untitled video";
  const channel = oembed.author_name ?? "Unknown channel";

  // 2. ytdl-core for richer metadata (duration, keywords, short description)
  let duration = null;
  let keywords = [];
  let ytDescription = "";

  try {
    const info = await ytdl.getBasicInfo(url);
    const details = info.videoDetails;
    duration = details.lengthSeconds ? `${Math.round(details.lengthSeconds / 60)}m ${details.lengthSeconds % 60}s` : null;
    keywords = (details.keywords ?? []).slice(0, 10);
    ytDescription = (details.shortDescription ?? "").slice(0, 500);
  } catch (e) {
    console.warn(`[urlResolver] ytdl-core failed for ${url}: ${e.message} — using oEmbed only`);
  }

  // 3. Gemini visual scene analysis — understand actual video content, not just metadata
  let sceneAnalysis = "";
  if (HAS_GEMINI) {
    try {
      sceneAnalysis = await geminiDescribeVideo(url, title);
      console.log(`[urlResolver] Gemini scene analysis done for: ${title}`);
    } catch (e) {
      console.warn(`[urlResolver] Gemini video analysis failed for ${url}: ${e.message} — falling back to metadata only`);
    }
  }

  // 4. Build a rich semantic description: scene analysis first (most searchable),
  //    then metadata as supporting context
  const parts = [
    `YouTube video: "${title}" by ${channel}`,
    sceneAnalysis || null,
    ytDescription || null,
    keywords.length ? `Tags: ${keywords.join(", ")}` : null,
    duration ? `Duration: ${duration}` : null,
  ].filter(Boolean);

  return {
    mediaType: "video",
    label: title,
    description: parts.join(". "),
    url,
    metadata: {
      source: "youtube",
      channel,
      duration,
      keywords,
      thumbnailUrl: oembed.thumbnail_url ?? null,
      embedUrl: oembed.html ? url : null,
    },
  };
}

// ── Image URL ─────────────────────────────────────────────────────────────────

const IMAGE_EXTS = /\.(jpe?g|png|gif|webp|bmp|svg|avif|tiff?)(\?.*)?$/i;
const IMAGE_MIME = /^image\//;

function isImageUrl(url) {
  try {
    const path = new URL(url).pathname;
    return IMAGE_EXTS.test(path);
  } catch { return false; }
}

async function resolveImage(url) {
  const label = deriveLabel(url);

  // Try to get AI caption via Gemini Vision
  if (HAS_GEMINI) {
    try {
      const { mimeType, base64 } = await fetchAsBase64(url, MAX_INLINE_BYTES);
      if (base64) {
        const caption = await geminiDescribeImage(base64, mimeType || "image/jpeg");
        return {
          mediaType: "image",
          label,
          description: caption,
          url,
          metadata: { source: "image_url", mimeType },
        };
      }
    } catch (e) {
      console.warn(`[urlResolver] Gemini Vision failed for ${url}: ${e.message}`);
    }
  }

  // Fallback: no description from model
  return {
    mediaType: "image",
    label,
    description: `Image: ${label}`,
    url,
    metadata: { source: "image_url" },
  };
}

// ── Audio URL ─────────────────────────────────────────────────────────────────

const AUDIO_EXTS = /\.(mp3|wav|ogg|flac|m4a|aac|opus|weba)(\?.*)?$/i;
const AUDIO_MIME = /^audio\//;

function isAudioUrl(url) {
  try {
    const path = new URL(url).pathname;
    return AUDIO_EXTS.test(path);
  } catch { return false; }
}

async function resolveAudio(url) {
  const label = deriveLabel(url);

  if (HAS_GEMINI) {
    try {
      const { mimeType, base64 } = await fetchAsBase64(url, MAX_INLINE_BYTES);
      if (base64) {
        const desc = await geminiDescribeAudio(base64, mimeType || "audio/mpeg");
        return {
          mediaType: "audio",
          label,
          description: desc,
          url,
          metadata: { source: "audio_url", mimeType },
        };
      }
    } catch (e) {
      console.warn(`[urlResolver] Gemini audio failed for ${url}: ${e.message}`);
    }
  }

  return {
    mediaType: "audio",
    label,
    description: `Audio file: ${label}`,
    url,
    metadata: { source: "audio_url" },
  };
}

// ── Content-Type sniff fallback ───────────────────────────────────────────────

async function resolveByContentType(url) {
  let contentType = "";
  try {
    const headResp = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8_000) });
    contentType = headResp.headers.get("content-type") ?? "";
  } catch (_) { /* ignore */ }

  if (IMAGE_MIME.test(contentType)) return resolveImage(url);
  if (AUDIO_MIME.test(contentType)) return resolveAudio(url);
  if (/^video\//.test(contentType)) {
    const label = deriveLabel(url);
    return {
      mediaType: "video",
      label,
      description: `Video: ${label}`,
      url,
      metadata: { source: "video_url", mimeType: contentType },
    };
  }

  throw Object.assign(
    new Error(
      `Cannot determine media type for URL: ${url}. ` +
        `Provide 'mediaType' and 'description' explicitly, or use a URL with a recognisable extension.`
    ),
    { status: 400 }
  );
}

// ── Gemini helpers ────────────────────────────────────────────────────────────

async function geminiDescribeImage(base64, mimeType) {
  const resp = await ai.models.generateContent({
    model: VISION_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: { mimeType, data: base64 },
          },
          {
            text: "Describe this image in 2–3 sentences. Focus on the subject, mood, lighting, colour palette, and composition. Be concise and factual.",
          },
        ],
      },
    ],
  });
  return resp.text?.trim() ?? "Image content (no description available)";
}

async function geminiDescribeVideo(youtubeUrl, title) {
  const resp = await ai.models.generateContent({
    model: VISION_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              fileUri: youtubeUrl,
            },
          },
          {
            text:
              "Watch this video and describe its actual visual content in 4–6 sentences. " +
              "Focus on: the scenes shown, locations, characters or people, actions, " +
              "objects, colours, and mood. " +
              "Do NOT repeat the video title or channel name. " +
              "Be specific and factual so this description can be used for semantic search.",
          },
        ],
      },
    ],
  });
  return resp.text?.trim() ?? "";
}

async function geminiDescribeAudio(base64, mimeType) {
  const resp = await ai.models.generateContent({
    model: VISION_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: { mimeType, data: base64 },
          },
          {
            text: "Describe this audio clip in 2–3 sentences. Include the genre, instrumentation or sound type, mood, tempo, and any notable features. Be concise.",
          },
        ],
      },
    ],
  });
  return resp.text?.trim() ?? "Audio content (no description available)";
}

// ── Utility ───────────────────────────────────────────────────────────────────

/**
 * Fetches a URL as a base64 string. Returns null base64 if the file is too large.
 * @param {string} url
 * @param {number} maxBytes
 * @returns {Promise<{ mimeType: string, base64: string|null }>}
 */
async function fetchAsBase64(url, maxBytes) {
  const resp = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${url}`);

  const mimeType = (resp.headers.get("content-type") ?? "").split(";")[0].trim();
  const contentLength = parseInt(resp.headers.get("content-length") ?? "0", 10);

  if (contentLength > maxBytes) {
    console.warn(`[urlResolver] ${url} is ${contentLength} bytes — too large for inline, skipping binary`);
    return { mimeType, base64: null };
  }

  const buffer = await resp.arrayBuffer();
  if (buffer.byteLength > maxBytes) {
    return { mimeType, base64: null };
  }

  const base64 = Buffer.from(buffer).toString("base64");
  return { mimeType, base64 };
}

/** Derives a human-readable label from a URL pathname. */
function deriveLabel(url) {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split("/").filter(Boolean).pop() ?? "media";
    // URL-decode and strip query strings that leaked in
    return decodeURIComponent(filename.split("?")[0]);
  } catch {
    return url.slice(0, 80);
  }
}
