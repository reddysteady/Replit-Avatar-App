
import { log } from '../logger'
import type { PersonaState, CorePersonaContext } from '@/types/AvatarPersonaConfig'

interface StateCheckpoint {
  timestamp: Date;
  parameters: Partial<CorePersonaContext>;
  confidence: number;
  stage: string;
}

/**
 * Manages persona session state for Phase 1 implementation
 * Handles interruptions, checkpoints, and recovery
 */
export class PersonaStateManager {
  private sessions: Map<string, PersonaState> = new Map()
  private readonly CHECKPOINT_INTERVAL = 2 // Save every 2 parameters
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Creates a new persona session
   */
  async createSession(userId: string): Promise<PersonaState> {
    const sessionId = `persona_${userId}_${Date.now()}`
    
    const newState: PersonaState = {
      sessionId,
      userId,
      phase: 'core',
      parameters: {},
      confidenceScores: {},
      conversationHistory: [],
      checkpoints: [],
      version: 1
    }

    this.sessions.set(sessionId, newState)
    log(`[PERSONA-STATE] Created new session: ${sessionId}`)
    
    return newState
  }

  /**
   * Updates session with new parameters and confidence scores
   */
  async updateSession(
    sessionId: string, 
    parameters: Partial<CorePersonaContext>,
    confidence: Record<string, number>,
    messages: Array<{role: string, content: string, timestamp: Date}>
  ): Promise<PersonaState | null> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      log(`[PERSONA-STATE] Session not found: ${sessionId}`)
      return null
    }

    // Update parameters and confidence
    session.parameters = { ...session.parameters, ...parameters }
    session.confidenceScores = { ...session.confidenceScores, ...confidence }
    session.conversationHistory = messages
    session.version += 1

    // Create checkpoint if we've hit the interval
    const paramCount = Object.keys(session.parameters).length
    if (paramCount > 0 && paramCount % this.CHECKPOINT_INTERVAL === 0) {
      await this.saveCheckpoint(session)
    }

    this.sessions.set(sessionId, session)
    return session
  }

  /**
   * Saves a checkpoint for recovery
   */
  async saveCheckpoint(state: PersonaState): Promise<void> {
    const checkpoint: StateCheckpoint = {
      timestamp: new Date(),
      parameters: { ...state.parameters },
      confidence: this.calculateOverallConfidence(state.confidenceScores),
      stage: this.determineStage(state.parameters)
    }

    state.checkpoints.push(checkpoint)
    
    // Keep only last 5 checkpoints
    if (state.checkpoints.length > 5) {
      state.checkpoints = state.checkpoints.slice(-5)
    }

    log(`[PERSONA-STATE] Checkpoint saved for session: ${state.sessionId}`)
  }

  /**
   * Restores a session by ID
   */
  async restoreSession(sessionId: string): Promise<PersonaState | null> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      log(`[PERSONA-STATE] Cannot restore session: ${sessionId}`)
      return null
    }

    // Check if session has expired
    const lastActivity = session.checkpoints.length > 0 
      ? session.checkpoints[session.checkpoints.length - 1].timestamp
      : new Date(Date.now() - this.SESSION_TIMEOUT - 1)

    if (Date.now() - lastActivity.getTime() > this.SESSION_TIMEOUT) {
      this.sessions.delete(sessionId)
      log(`[PERSONA-STATE] Session expired: ${sessionId}`)
      return null
    }

    log(`[PERSONA-STATE] Session restored: ${sessionId}`)
    return session
  }

  /**
   * Marks session as completed
   */
  async completeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.phase = 'completed'
    session.completedAt = new Date()
    
    // Final checkpoint
    await this.saveCheckpoint(session)
    
    log(`[PERSONA-STATE] Session completed: ${sessionId}`)
    return true
  }

  /**
   * Calculates overall confidence from individual scores
   */
  private calculateOverallConfidence(scores: Record<string, number>): number {
    const values = Object.values(scores)
    if (values.length === 0) return 0
    
    return values.reduce((sum, score) => sum + score, 0) / values.length
  }

  /**
   * Determines current stage based on collected parameters
   */
  private determineStage(parameters: Partial<CorePersonaContext>): string {
    const paramCount = Object.keys(parameters).length
    
    if (paramCount === 0) return 'introduction'
    if (paramCount < 2) return 'discovery'
    if (paramCount < 4) return 'core_collection'
    if (paramCount < 6) return 'persona_preview'
    return 'completion'
  }

  /**
   * Cleans up expired sessions
   */
  async cleanup(): Promise<void> {
    const now = Date.now()
    let cleaned = 0

    for (const [sessionId, session] of this.sessions.entries()) {
      const lastActivity = session.checkpoints.length > 0 
        ? session.checkpoints[session.checkpoints.length - 1].timestamp
        : new Date(now - this.SESSION_TIMEOUT - 1)

      if (now - lastActivity.getTime() > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId)
        cleaned++
      }
    }

    if (cleaned > 0) {
      log(`[PERSONA-STATE] Cleaned up ${cleaned} expired sessions`)
    }
  }

  /**
   * Gets session statistics
   */
  getSessionStats(sessionId: string): any {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    return {
      parameterCount: Object.keys(session.parameters).length,
      overallConfidence: this.calculateOverallConfidence(session.confidenceScores),
      currentStage: this.determineStage(session.parameters),
      checkpointCount: session.checkpoints.length,
      conversationLength: session.conversationHistory.length
    }
  }
}

export const personaStateManager = new PersonaStateManager()

// Cleanup expired sessions every hour
setInterval(() => {
  personaStateManager.cleanup()
}, 60 * 60 * 1000)
