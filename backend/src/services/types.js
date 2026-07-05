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
