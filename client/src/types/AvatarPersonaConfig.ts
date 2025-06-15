// See CHANGELOG.md for 2025-06-18 [Added]
/**
 * Configuration describing an avatar's persona.
 */
export interface AvatarPersonaConfig {
  /**
   * Freeform text describing the avatar's tone and overall speaking style.
   */
  toneDescription: string
  /**
   * Additional style keywords to reinforce the desired voice.
   */
  styleTags: string[]
  /**
   * Topics that the avatar is allowed to discuss.
   */
  allowedTopics: string[]
  /**
   * Topics that must not be discussed by the avatar.
   */
  restrictedTopics: string[]
  /**
   * Default response when a user asks about a restricted topic.
   */
  fallbackReply: string
}
