/**
 * JSDoc type definitions for MythosAI backend.
 * Not compiled — used purely for editor IntelliSense via @typedef.
 */

/**
 * @typedef {Object} Scene
 * @property {number}   sceneNumber
 * @property {string}   title
 * @property {string}   setting
 * @property {"DAY"|"NIGHT"|"DAWN"|"DUSK"} timeOfDay
 * @property {string[]} characters
 * @property {string}   description
 * @property {string}   emotionalTone
 * @property {string}   audioMoodPrompt
 */

/**
 * @typedef {Object} Shot
 * @property {number} shotNumber
 * @property {string} shotType
 * @property {string} cameraAngle
 * @property {string} cameraMovement
 * @property {string} lens
 * @property {string} description
 * @property {string} imagePrompt
 */

/**
 * @typedef {Object} ImageResult
 * @property {boolean}     success
 * @property {string|null} dataUri   base64 data URI
 * @property {string}      model
 * @property {string|null} error
 */

/**
 * @typedef {Object} AudioResult
 * @property {boolean}     success
 * @property {string|null} dataUri   base64 data URI (audio/wav)
 * @property {string}      model
 * @property {string|null} error
 */

/**
 * @typedef {Object} MultimodalAssets
 * @property {ImageResult} image
 * @property {AudioResult} audio
 */

/**
 * @typedef {Object} EnrichedScene
 * @property {Scene}            scene
 * @property {Shot[]}           shots
 * @property {MultimodalAssets} assets
 */

/**
 * @typedef {Object} StoryOutput
 * @property {string}         storyId
 * @property {string}         title
 * @property {string}         premise
 * @property {EnrichedScene[]} scenes
 * @property {string}         generatedAt  ISO timestamp
 */

// ── Multimodal RAG types ──────────────────────────────────────────────────────

/**
 * @typedef {Object} MediaAsset
 * @property {"image"|"audio"|"video"} mediaType
 * @property {string}  label        Human-readable name / filename
 * @property {string}  description  Text description used for embedding
 * @property {string}  [url]        Optional URL or data-URI of the file
 * @property {object}  [metadata]   Arbitrary extra fields (duration, tags, etc.)
 */

/**
 * @typedef {Object} IngestedAsset
 * @property {string}  id
 * @property {"image"|"audio"|"video"} mediaType
 * @property {string}  label
 */

/**
 * @typedef {Object} RagSearchResult
 * @property {number}  rank              1-based rank (1 = most similar)
 * @property {string}  id
 * @property {"image"|"audio"|"video"} mediaType
 * @property {string}  label
 * @property {string}  description
 * @property {string|null} url
 * @property {object}  metadata
 * @property {string}  createdAt
 * @property {number}  similarityScore   cosine similarity in [0, 1]
 * @property {string}  similarityPct     e.g. "94.32%"
 */

/**
 * @typedef {Object} RagSearchResponse
 * @property {string}           query
 * @property {string}           mediaTypeFilter
 * @property {number}           topK
 * @property {number}           totalFound
 * @property {RagSearchResult[]} results
 */
