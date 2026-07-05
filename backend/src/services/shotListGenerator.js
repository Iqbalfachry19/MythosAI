/**
 * shotListGenerator.js
 * Generates a cinematic shot list for each scene using an LLM.
 * Falls back to deterministic mock data when no OpenAI key is present.
 */

import OpenAI from "openai";

const USE_MOCK = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith("sk-...");
const openai = USE_MOCK ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SHOT_SYSTEM_PROMPT = `You are a cinematographer and director of photography.
Given a scene description, generate exactly 3–4 shots for that scene.
Each shot must be a JSON object:
{
  "shotNumber": number,
  "shotType": string,       // e.g. "ECU", "CU", "MS", "WS", "EWS", "POV", "OTS"
  "cameraAngle": string,    // e.g. "eye-level", "low-angle", "high-angle", "dutch tilt"
  "cameraMovement": string, // e.g. "static", "slow dolly in", "tracking", "handheld"
  "lens": string,           // e.g. "35mm", "85mm telephoto", "wide angle 18mm"
  "description": string,    // what the camera sees in 1 sentence
  "imagePrompt": string     // detailed prompt for storyboard image generation
}
Return ONLY a valid JSON array.`;

/**
 * @param {import("./types.js").Scene} scene
 * @returns {Promise<import("./types.js").Shot[]>}
 */
export async function generateShotList(scene) {
  if (USE_MOCK) {
    return buildMockShots(scene);
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SHOT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `SCENE ${scene.sceneNumber}: ${scene.title}\nSETTING: ${scene.setting}\nDESCRIPTION: ${scene.description}`,
      },
    ],
    temperature: 0.6,
  });

  const raw = completion.choices[0].message.content;
  const parsed = JSON.parse(raw);
  const shots = Array.isArray(parsed) ? parsed : parsed.shots ?? Object.values(parsed)[0];

  if (!Array.isArray(shots)) throw new Error("LLM returned unexpected shape for shots.");
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
