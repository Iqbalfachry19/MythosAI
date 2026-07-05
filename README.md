# MythosAI 🎬

**AI Creative Partner Suite & Multimodal Storytelling Platform**

MythosAI takes a raw story premise and produces a complete creative production package:
scenes, shot lists, storyboard images, and ambient audio — all in one dashboard.

---

## Architecture

```
mythosai/
├── backend/          # Node.js / Express API
│   ├── src/
│   │   ├── server.js                        # Entry point
│   │   ├── routes/
│   │   │   ├── story.js                     # POST /api/generate-story
│   │   │   └── export.js                    # POST /api/export/{pdf,markdown}
│   │   ├── controllers/
│   │   │   ├── storyController.js           # Pipeline orchestrator
│   │   │   └── exportController.js          # PDF + Markdown export
│   │   └── services/
│   │       ├── sceneBreaker.js              # LLM scene breakdown
│   │       ├── shotListGenerator.js         # LLM shot list generation
│   │       ├── multimodalClient.js          # HF Image + Audio API client
│   │       └── types.js                     # JSDoc type definitions
│   ├── .env.example
│   └── package.json
│
└── frontend/         # React + Vite + Tailwind
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   ├── api/
    │   │   └── mythosApi.js                 # Axios API client
    │   └── components/
    │       ├── PremiseForm.jsx              # Story input UI
    │       ├── StoryDashboard.jsx           # Tabbed scene navigator
    │       └── SceneCard.jsx                # Scene detail + assets
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Pipeline

```
User Premise (text)
       │
       ▼
 sceneBreaker.js  ──── GPT-4o-mini ──→  Scene[]
       │
       ├── For each Scene (parallel):
       │       ├── shotListGenerator.js  ──── GPT-4o-mini ──→ Shot[]
       │       └── multimodalClient.js
       │               ├── generateStoryboardImage()  ──→ HF SDXL   → base64 PNG
       │               └── generateAudioMood()        ──→ HF MusicGen → base64 WAV
       ▼
 StoryOutput JSON  ──→  Frontend Dashboard  ──→  PDF / Markdown export
```

---

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in OPENAI_API_KEY and HF_API_KEY in .env
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Environment Variables

| Variable           | Required | Description                                      |
|--------------------|----------|--------------------------------------------------|
| `OPENAI_API_KEY`   | Optional | GPT-4o-mini for scene + shot list (mocked if absent) |
| `HF_API_KEY`       | Optional | Hugging Face Inference API key                  |
| `HF_IMAGE_MODEL`   | Optional | Default: `stabilityai/stable-diffusion-xl-base-1.0` |
| `HF_AUDIO_MODEL`   | Optional | Default: `facebook/musicgen-small`              |
| `PORT`             | Optional | Backend port (default: 3001)                    |
| `FRONTEND_ORIGIN`  | Optional | CORS allowed origin (default: *)                |

> **No API keys?** The backend gracefully falls back to deterministic mock data for both
> scene breakdown and shot lists. Multimodal assets will report `success: false` with an
> error message — the dashboard displays a placeholder instead of crashing.

---

## API Reference

### `POST /api/generate-story`
**Body:** `{ "premise": "string (20–4000 chars)" }`  
**Returns:** `StoryOutput` JSON with scenes, shots, storyboard images, and audio.

### `POST /api/export/pdf`
**Body:** `{ "storyData": StoryOutput }`  
**Returns:** PDF binary download.

### `POST /api/export/markdown`
**Body:** `{ "storyData": StoryOutput }`  
**Returns:** Markdown text download.

### `GET /health`
Returns `{ "status": "ok" }`.
