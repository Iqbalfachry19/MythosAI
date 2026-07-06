# MythosAI 🎬

**AI Creative Partner Suite — Multimodal Storytelling + Media RAG Platform**

MythosAI has three core features:

1. **Story Generator** — takes a raw premise and produces scenes, shot lists, storyboard images, and ambient audio.
2. **Media RAG** — index images, audio files, and YouTube videos by URL, then search them semantically using natural language. Results are ranked by cosine similarity.
3. **Writing Workspace** — local-first character manager, outline board, worldbuilding panel, locations, ideas, and citations. All stored in `localStorage`.

Authentication is handled by **Supabase** (email/password + Google OAuth). The app is fully gated behind login.

---

Live Demo: [mythosaicreative.netlify.app](https://mythosaicreative.netlify.app/)

## Architecture

```
mythosai/
├── backend/          # Node.js / Express API
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   │   ├── story.js            # POST /api/generate-story
│   │   │   ├── export.js           # POST /api/export/{pdf,markdown}
│   │   │   └── rag.js              # POST /api/rag/{ingest,ingest-url,ingest-batch,search}
│   │   ├── controllers/
│   │   │   ├── storyController.js
│   │   │   ├── exportController.js
│   │   │   └── ragController.js
│   │   └── services/
│   │       ├── sceneBreaker.js       # Gemini scene breakdown
│   │       ├── shotListGenerator.js  # Gemini shot list
│   │       ├── multimodalClient.js   # Gemini image + Lyria audio generation
│   │       ├── urlResolver.js        # YouTube / image / audio URL → descriptor
│   │       ├── embedder.js           # Gemini text-embedding-004 (768d)
│   │       ├── astraClient.js        # AstraDB singleton + vector search
│   │       ├── mediaRag.js           # ingestMedia / ingestUrl / searchMedia
│   │       └── types.js
│   ├── .env.example
│   └── package.json
│
└── frontend/         # React + Vite + Tailwind
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx                       # Top-level nav + auth gate
    │   ├── index.css
    │   ├── lib/
    │   │   └── supabase.js               # Supabase client singleton
    │   ├── context/
    │   │   └── AuthContext.jsx           # Session state + signIn/signOut/Google OAuth
    │   ├── api/
    │   │   └── mythosApi.js              # generateStory, ragIngestUrl, ragIngest, ragSearch, export
    │   └── components/
    │       ├── LoginPage.jsx             # Email/password + Google OAuth login UI
    │       ├── PremiseForm.jsx           # Story input UI
    │       ├── StoryDashboard.jsx        # Tabbed scene navigator
    │       ├── SceneCard.jsx             # Scene detail + storyboard + audio
    │       ├── MediaRagPage.jsx          # Ingest (URL / manual) + Search with ranked results
    │       ├── WritingWorkspace.jsx      # Workspace shell with tab bar
    │       ├── CharacterManager.jsx      # Character CRUD + reference images
    │       ├── LocationManager.jsx       # Location CRUD + reference images
    │       ├── WorldbuildingPanel.jsx    # World entry CRUD + reference images
    │       ├── OutlineBoard.jsx          # Act/chapter outline + Kanban view
    │       ├── BraindumpBoard.jsx        # Ideas capture + writing goals
    │       ├── CitationTracker.jsx       # Research references + APA export
    │       ├── TutorialModal.jsx         # Step-by-step onboarding popup
    │       ├── ConfirmDialog.jsx         # Reusable delete confirmation dialog
    │       └── ImageUploadField.jsx      # File upload or URL for reference images
    ├── .env.example
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Pipeline

### Story Generator

```
User Premise
     │
     ▼
sceneBreaker.js  ── Gemini 2.0 Flash ──→ Scene[]
     │
     ├── For each Scene:
     │       ├── shotListGenerator.js  ── Gemini ──→ Shot[]
     │       └── multimodalClient.js
     │               ├── generateStoryboardImage()  ── Gemini Image ──→ base64 PNG
     │               └── generateAudioMood()        ── Lyria 3      ──→ base64 MP3
     ▼
StoryOutput JSON ──→ Frontend Dashboard ──→ PDF / Markdown export
```

### Media RAG

```
URL (YouTube / image / audio)
     │
     ▼
urlResolver.js
     ├── YouTube  → oEmbed + ytdl-core  → title, channel, duration, tags
     ├── Image    → fetch binary        → Gemini Vision caption
     └── Audio    → fetch binary        → Gemini audio description
     │
     ▼
embedder.js  ── Gemini text-embedding-004 ──→ 768-dim vector
     │
     ▼
astraClient.js ──→ AstraDB (cosine similarity collection)

Search:  query → embed → AstraDB vector find → ranked results (score 0–1)
```

---

## Setup

### 1. Supabase (Authentication)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → API** and copy:
   - **Project URL** (`VITE_SUPABASE_URL`)
   - **Publishable / anon key** (`VITE_SUPABASE_PUBLISHABLE_KEY`)
3. Create `frontend/.env` from the example and fill in the values:

```bash
cp frontend/.env.example frontend/.env
# then edit the file with your real keys
```

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key-here
```

4. *(Optional)* To enable **Google OAuth**, go to **Authentication → Providers → Google** in the Supabase dashboard and add your Google client credentials. The redirect URL to whitelist is `http://localhost:5173` (dev) or your production domain.

> **Email confirmation** — Supabase sends a confirmation email on sign-up by default. You can disable this in **Authentication → Settings → Email Auth → Confirm email** for easier local testing.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in the keys (see Environment Variables below)
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — you will be prompted to sign in or create an account.

---

## Authentication Flow

```
User lands on app
      │
      ▼
AuthContext checks Supabase session
      ├── session === undefined  →  Loading spinner
      ├── session === null       →  LoginPage (email/password or Google OAuth)
      └── session present        →  Full app (Story Generator, Media RAG, Writing Workspace)
                                          │
                                          └── "Sign out" button in header → clears session
```

---

## Environment Variables

### Frontend (Supabase Auth)

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | **Yes** | Your Supabase project URL — `https://<id>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Yes** | Supabase publishable / anon key |

### Story Generator

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Optional | Gemini for scene breakdown, shot list, image, audio. Mocked if absent. |
| `GEMINI_MODEL` | Optional | Default: `gemini-2.0-flash` |
| `GEMINI_IMAGE_MODEL` | Optional | Default: `gemini-3.1-flash-image` |
| `GEMINI_AUDIO_MODEL` | Optional | Default: `lyria-3-clip-preview` |
| `PORT` | Optional | Backend port (default: `3001`) |
| `FRONTEND_ORIGIN` | Optional | CORS allowed origin (default: `*`) |
| `EXTERNAL_API_TIMEOUT` | Optional | Timeout ms for Gemini calls (default: `30000`) |

### Media RAG

| Variable | Required | Description |
|---|---|---|
| `ASTRA_DB_APPLICATION_TOKEN` | **Yes** | DataStax Astra token — from Astra console → Connect |
| `ASTRA_DB_API_ENDPOINT` | **Yes** | `https://<db-id>-<region>.apps.astra.datastax.com` |
| `ASTRA_DB_COLLECTION` | Optional | Collection name (default: `media_assets`, auto-created) |
| `GEMINI_API_KEY` | Optional | Reused for `text-embedding-004`, Vision captioning, audio description |

> **No API keys?** Story generation and RAG ingest fall back to mock data / filename-only descriptions.
> YouTube ingest works without any key (uses the free oEmbed API).

---

## API Reference

### Story

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| POST | `/api/generate-story` | `{ premise: string }` | `StoryOutput` JSON |
| POST | `/api/export/pdf` | `{ storyData }` | PDF binary |
| POST | `/api/export/markdown` | `{ storyData }` | Markdown text |
| GET | `/health` | — | `{ status: "ok" }` |

### Media RAG

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/rag/ingest-url` | `{ url, label?, description?, mediaType?, metadata? }` | Index from public URL — auto-detects type |
| POST | `/api/rag/ingest` | `{ mediaType, label, description, url?, metadata? }` | Index with manual descriptor |
| POST | `/api/rag/ingest-batch` | `{ assets: [...] }` | Bulk index (max 100); URL-only items auto-resolve |
| POST | `/api/rag/search` | `{ query, topK?, mediaType? }` | Semantic search, ranked by cosine similarity |

#### `/api/rag/ingest-url` — example bodies

```jsonc
// YouTube
{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }

// Image (auto-captioned by Gemini Vision)
{ "url": "https://cdn.example.com/hero.jpg", "label": "Hero portrait" }

// Audio (auto-described by Gemini)
{ "url": "https://cdn.example.com/battle.mp3", "metadata": { "album": "Game OST" } }
```

#### `/api/rag/search` — example response

```json
{
  "ok": true,
  "data": {
    "query": "dramatic night scene with tension",
    "mediaTypeFilter": "video",
    "topK": 5,
    "totalFound": 2,
    "results": [
      {
        "rank": 1,
        "mediaType": "video",
        "label": "chase_scene.mp4",
        "description": "High-speed car chase, night, rain",
        "similarityScore": 0.934812,
        "similarityPct": "93.48%"
      }
    ]
  }
}
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Authentication | Supabase (email/password + Google OAuth) |
| Backend | Node.js 18+ / Express 4 |
| LLM / Generation | Google Gemini 2.0 Flash, Gemini Image, Lyria 3 |
| Embedding | Gemini `text-embedding-004` (768-dim) |
| Vector Database | DataStax AstraDB (cosine similarity) |
| YouTube metadata | ytdl-core + YouTube oEmbed API |
| Export | PDFKit (PDF), plain Markdown |
