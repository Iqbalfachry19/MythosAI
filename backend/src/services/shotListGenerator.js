/**
 * shotListGenerator.js
 * Generates a cinematic shot list for each scene using Google Gemini.
 * Falls back to deterministic mock data when no Gemini key is present.
 */

import { GoogleGenAI } from "@google/genai";

const USE_MOCK = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith("AIza...");

const ai = USE_MOCK ? null : new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const SHOT_PROMPT_TEMPLATE = (scene) =>
  `You are a cinematographer and director of photography.
Given the scene below, generate exactly 3–4 shots.
Each shot must be a JSON object:
{
  "shotNumber": number,
  "shotType": string,       
  "cameraAngle": string,    
  "cameraMovement": string, 
  "lens": string,           
  "description": string,    
  "imagePrompt": string     
}
Return ONLY a valid JSON array, no markdown fences, no commentary.

SCENE ${scene.sceneNumber}: ${scene.title}
SETTING: ${scene.setting}
TIME: ${scene.timeOfDay}
CHARACTERS: ${scene.characters.join(", ")}
DESCRIPTION: ${scene.description}
TONE: ${scene.emotionalTone}`;

/**
 * @param {import("./types.js").Scene} scene
 * @returns {Promise<import("./types.js").Shot[]>}
 */
export async function generateShotList(scene) {
  if (USE_MOCK) {
    return buildMockShots(scene);
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: SHOT_PROMPT_TEMPLATE(scene),
    config: {
      responseMimeType: "application/json",
      temperature: 0.6,
    },
  });

  const text = response.text;

  const parsed = JSON.parse(text);
  const shots = Array.isArray(parsed) ? parsed : parsed.shots ?? Object.values(parsed)[0];

  if (!Array.isArray(shots)) throw new Error("Gemini returned unexpected shape for shots.");
  return shots;
}

// ── Mock fallback ────────────────────────────────────────────────────────────

function buildMockShots(scene) {
  return [
    {
      shotNumber: 1,
      shotType: "EWS",
      cameraAngle: "high-angle",
      cameraMovement: "slow aerial descent",
      lens: "wide angle 18mm",
      description: `Establishing wide shot of ${scene.setting} to orient the viewer.`,
      imagePrompt: `Cinematic establishing shot of ${scene.setting}, ${scene.timeOfDay.toLowerCase()}, ${scene.emotionalTone} mood, photorealistic, film grain, 4k`,
    },
    {
      shotNumber: 2,
      shotType: "MS",
      cameraAngle: "eye-level",
      cameraMovement: "slow dolly in",
      lens: "35mm",
      description: `Medium shot of ${scene.characters[0] ?? "protagonist"} entering the scene.`,
      imagePrompt: `Medium shot of a ${scene.characters[0] ?? "character"} in ${scene.setting}, ${scene.emotionalTone} atmosphere, cinematic lighting, film still`,
    },
    {
      shotNumber: 3,
      shotType: "CU",
      cameraAngle: "eye-level",
      cameraMovement: "static",
      lens: "85mm telephoto",
      description: "Close-up on the character's face revealing inner emotion.",
      imagePrompt: `Extreme close up face portrait, ${scene.emotionalTone} expression, cinematic, shallow depth of field, dramatic lighting`,
    },
    {
      shotNumber: 4,
      shotType: "WS",
      cameraAngle: "low-angle",
      cameraMovement: "tracking",
      lens: "35mm",
      description: "Wide tracking shot following the character through the environment.",
      imagePrompt: `Wide cinematic tracking shot, ${scene.setting}, ${scene.timeOfDay.toLowerCase()}, ${scene.emotionalTone}, motion blur, film look`,
    },
  ];
}
