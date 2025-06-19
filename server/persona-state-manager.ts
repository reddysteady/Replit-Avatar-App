// Persona state manager for handling AI avatar personalities and responses
import type { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'

interface PersonaState {
  config: AvatarPersonaConfig
  lastUsed: Date
  messageCount: number
}

class PersonaStateManager {
  private personas: Map<number, PersonaState> = new Map()

  /**
   * Get or create persona state for a user
   */
  getPersonaState(userId: number): PersonaState {
    if (!this.personas.has(userId)) {
      const defaultConfig: AvatarPersonaConfig = {
        toneDescription: 'Friendly and professional AI assistant that provides helpful responses',
        styleTags: ['friendly', 'professional', 'helpful'],
        allowedTopics: ['general', 'business', 'technology', 'creative'],
        restrictedTopics: ['inappropriate', 'harmful'],
        fallbackReply: "Thanks for your message! I'd prefer not to discuss that topic.",
        avatarObjective: ['Provide helpful assistance', 'Engage positively with users'],
        audienceDescription: 'General users seeking helpful information and assistance'
      }

      this.personas.set(userId, {
        config: defaultConfig,
        lastUsed: new Date(),
        messageCount: 0
      })
    }

    return this.personas.get(userId)!
  }

  /**
   * Update persona configuration for a user
   */
  updatePersonaConfig(userId: number, config: Partial<AvatarPersonaConfig>): void {
    const state = this.getPersonaState(userId)
    state.config = { ...state.config, ...config }
    state.lastUsed = new Date()
  }

  /**
   * Increment message count and update last used timestamp
   */
  recordMessageUsage(userId: number): void {
    const state = this.getPersonaState(userId)
    state.messageCount++
    state.lastUsed = new Date()
  }

  /**
   * Get persona configuration for a user
   */
  getPersonaConfig(userId: number): AvatarPersonaConfig {
    return this.getPersonaState(userId).config
  }

  /**
   * Reset persona state for a user
   */
  resetPersonaState(userId: number): void {
    this.personas.delete(userId)
  }

  /**
   * Get all active personas
   */
  getAllPersonas(): Map<number, PersonaState> {
    return new Map(this.personas)
  }
}

export const personaStateManager = new PersonaStateManager()