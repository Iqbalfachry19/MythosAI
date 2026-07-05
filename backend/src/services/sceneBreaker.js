/**
 * sceneBreaker.js
 * Converts a raw story premise into a structured array of scenes.
 * Uses OpenAI when the API key is configured; falls back to deterministic mock data.
 */

import OpenAI from "openai";

const USE_MOCK = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith("sk-...");

const openai = USE_MOCK ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SCENE_SYSTEM_PROMPT = `You are a professional screenplay analyst and story structure expert.
Given a story premise or synopsis, break it into 3–6 distinct scenes.
For each scene return a JSON object with exactly these fields:
{
  "sceneNumber": number,
  "title": string,
  "setting": string,
  "timeOfDay": "DAY" | "NIGHT" | "DAWN" | "DUSK",
  "characters": string[],
  "description": string,          // 2–3 sentences max
  "emotionalTone": string,        // e.g. "tense", "hopeful", "melancholic"
  "audioMoodPrompt": string       // short phrase for audio generation
}
Return ONLY a valid JSON array, no markdown, no commentary.`;

/**
 * @param {string} premise
 * @returns {Promise<import("./types.js").Scene[]>}
 */
export async function breakIntoScenes(premise) {
  if (USE_MOCK) {
    console.warn("[sceneBreaker] No OpenAI key — using mock scenes.");
    return buildMockScenes(premise);
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SCENE_SYSTEM_PROMPT },
      { role: "user", content: `PREMISE:\n${premise}` },
    ],
    temperature: 0.7,
  });

  const raw = completion.choices[0].message.content;

  // The model wraps the array in an object — unwrap safely
  const parsed = JSON.parse(raw);
  const scenes = Array.isArray(parsed) ? parsed : parsed.scenes ?? Object.values(parsed)[0];

  if (!Array.isArray(scenes)) throw new Error("LLM returned unexpected shape for scenes.");
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
