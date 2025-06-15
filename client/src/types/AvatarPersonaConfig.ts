// Added for persona config feature - see CHANGELOG.md entry
/**
 * Configuration describing the creator's desired avatar persona.
 */
export interface AvatarPersonaConfig {
  /** A free form description of tone and communication style */
  toneDescription: string
  /** Short style tags like "Friendly", "Sarcastic" */
  styleTags: string[]
  /** Topics the avatar may discuss */
  allowedTopics: string[]
  /** Topics the avatar must avoid */
  restrictedTopics: string[]
  /** Default reply when a restricted topic is asked */
  fallbackReply: string
}
