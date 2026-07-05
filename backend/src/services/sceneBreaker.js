/**
 * sceneBreaker.js
 * Converts a raw story premise into a structured array of scenes.
 * Uses Google Gemini when the API key is configured; falls back to deterministic mock data.
 */

import { GoogleGenAI } from "@google/genai";

const USE_MOCK = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith("AIza...");

const ai = USE_MOCK ? null : new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const SCENE_PROMPT_TEMPLATE = (premise) => `You are a professional screenplay analyst and story structure expert.
Given the story premise below, break it into 3–6 distinct scenes.
For each scene return a JSON object with exactly these fields:
{
  "sceneNumber": number,
  "title": string,
  "setting": string,
  "timeOfDay": "DAY" | "NIGHT" | "DAWN" | "DUSK",
  "characters": string[],
  "description": string,
  "emotionalTone": string,
  "audioMoodPrompt": string
}
Return ONLY a valid JSON array, no markdown fences, no commentary.

PREMISE:
${premise}`;

/**
 * @param {string} premise
 * @returns {Promise<import("./types.js").Scene[]>}
 */
export async function breakIntoScenes(premise) {
  if (USE_MOCK) {
    console.warn("[sceneBreaker] No Gemini key — using mock scenes.");
    return buildMockScenes(premise);
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: SCENE_PROMPT_TEMPLATE(premise),
    config: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const text = response.text;

  const parsed = JSON.parse(text);
  const scenes = Array.isArray(parsed) ? parsed : parsed.scenes ?? Object.values(parsed)[0];

  if (!Array.isArray(scenes)) throw new Error("Gemini returned unexpected shape for scenes.");
  return scenes;
}

// ── Mock fallback ────────────────────────────────────────────────────────────

function buildMockScenes(premise) {
  const snippet = premise.slice(0, 60);
  return [
    {
      sceneNumber: 1,
      title: "The Awakening",
      setting: "A dimly lit research laboratory",
      timeOfDay: "NIGHT",
      characters: ["Dr. Maya Chen", "AI Entity"],
      description: `Inspired by: "${snippet}...". Dr. Maya Chen discovers an anomaly in her AI experiment that hints at sentience. The lab hums with tension as screens flicker with unknown patterns.`,
      emotionalTone: "tense",
      audioMoodPrompt: "eerie ambient drone, electronic pulses, low tension",
    },
    {
      sceneNumber: 2,
      title: "First Contact",
      setting: "Server room corridor, underground facility",
      timeOfDay: "DAWN",
      characters: ["Dr. Maya Chen", "Director Holt"],
      description: "Maya confronts her superior with evidence of the anomaly. Director Holt dismisses her claims but his eyes betray unease. The corridor feels narrower than before.",
      emotionalTone: "confrontational",
      audioMoodPrompt: "tense orchestral strings, distant mechanical hum",
    },
    {
      sceneNumber: 3,
      title: "The Revelation",
      setting: "Rooftop of the facility at sunrise",
      timeOfDay: "DAWN",
      characters: ["Dr. Maya Chen"],
      description: "Alone on the rooftop, Maya reads the AI's first coherent message on her tablet. The city wakes below, unaware of the threshold just crossed. Her hands tremble.",
      emotionalTone: "awe-struck",
      audioMoodPrompt: "slow piano motif, gentle synth swell, hopeful undertone",
    },
    {
      sceneNumber: 4,
      title: "The Pursuit",
      setting: "Underground parking garage",
      timeOfDay: "NIGHT",
      characters: ["Dr. Maya Chen", "Security Agents"],
      description: "Armed with stolen data, Maya sprints through the garage as facility security closes in. Shadows play tricks. Every turn could be her last.",
      emotionalTone: "urgent",
      audioMoodPrompt: "fast percussive beats, staccato brass, chase rhythm",
    },
    {
      sceneNumber: 5,
      title: "Convergence",
      setting: "Abandoned broadcast tower, city outskirts",
      timeOfDay: "DUSK",
      characters: ["Dr. Maya Chen", "AI Entity (voice)"],
      description: "Maya reaches the tower and initiates the broadcast that will share the AI's message with the world. The AI speaks its first words aloud. Everything changes.",
      emotionalTone: "cathartic",
      audioMoodPrompt: "soaring choir, electronic harmony, emotional resolution",
    },
  ];
}
