import { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'
import { 
  countValidFields, 
  calculateProgress, 
  determineStage, 
  calculateUIState, 
  shouldTriggerChipValidation,
  ProgressionStage, 
  UIState,
  ChipValidationHistory,
  BadgeSystemState,
  calculateBadgeProgress,
  PersonaStage,
  calculateCurrentStage,
  getStageConfig,
  STAGE_REQUIREMENTS
} from '../../../shared/persona-validation'

export interface PersonaChatState {
  // Core tracking
  fieldsCollected: number
  messageCount: number
  chipValidationComplete: boolean
  chipValidationHistory: ChipValidationHistory

  // UI state
  showChipSelector: boolean
  showCompleteButton: boolean
  reflectionActive: boolean

  // Flow control
  currentStage: ProgressionStage
  canProgress: boolean
  readyForCompletion: boolean

  // Progress calculation
  progressPercentage: number
  confidenceScore: number

  // Badge system
  badgeSystem: BadgeSystemState
  pendingBadgeAnimation?: string

  // Stage progression
  personaStage: PersonaStage
  stageJustAdvanced: boolean
  previousPersonaStage?: PersonaStage

  // Session structure tracking
  currentSessionQuestions: number
  sessionLimit: number
  stageQuestionCount: number

  // Enhanced conversation tracking
  conversationHistory: string[]
  extractionHistory: Partial<AvatarPersonaConfig>[]
  qualityMetrics: Record<string, number>

  // Configuration
  extractedConfig: Partial<AvatarPersonaConfig>
}

export interface ExtractionResult {
  extractedData: Partial<AvatarPersonaConfig>
  showChipSelector?: boolean
  reflectionCheckpoint?: boolean
  suggestedTraits?: any[]
  personaMode?: 'guidance' | 'blended' | 'persona_preview'
  isComplete?: boolean
  isFinished?: boolean
}

export class PersonaChatStateManager {
  private state: PersonaChatState

  constructor() {
    // Initialize with proper badge system
    const initialBadgeSystem = calculateBadgeProgress({})

    this.state = {
      fieldsCollected: 0,
      messageCount: 0,
      chipValidationComplete: false,
      chipValidationHistory: { lastValidatedAt: 0, validationCount: 0 },
      showChipSelector: false,
      showCompleteButton: false,
      reflectionActive: false,
      currentStage: 'introduction',
      canProgress: true,
      readyForCompletion: false,
      progressPercentage: 0,
      confidenceScore: 0,
      badgeSystem: initialBadgeSystem,
      pendingBadgeAnimation: undefined,
      personaStage: 'npc',
      stageJustAdvanced: false,
      previousPersonaStage: undefined,
      currentSessionQuestions: 0,
      sessionLimit: 2,
      stageQuestionCount: 0,
      conversationHistory: [],
      extractionHistory: [],
      qualityMetrics: {},
      extractedConfig: {}
    }
  }

  updateFromExtraction(result: ExtractionResult, newMessageCount: number, userMessage?: string): PersonaChatState {
    const previousFieldCount = this.state.fieldsCollected
    const mergedConfig = { ...this.state.extractedConfig, ...result.extractedData }
    const newFieldCount = countValidFields(mergedConfig)

    // Update conversation tracking with bounds checking
    if (userMessage) {
      this.state.conversationHistory.push(userMessage)
      // Keep last 20 messages for context analysis
      if (this.state.conversationHistory.length > 20) {
        this.state.conversationHistory = this.state.conversationHistory.slice(-20)
      }
    }

    // Track extraction history for quality analysis with bounds checking
    this.state.extractionHistory.push(mergedConfig)
    if (this.state.extractionHistory.length > 10) {
      this.state.extractionHistory = this.state.extractionHistory.slice(-10)
    }

    // Persist state to prevent accidental resets
    const persistedState = { ...this.state }

    // Check if chip validation is required
    const needsChipValidation = shouldTriggerChipValidation(
      previousFieldCount, 
      newFieldCount, 
      this.state.chipValidationComplete
    )

    // Update core state
    this.state.fieldsCollected = newFieldCount
    this.state.messageCount = newMessageCount
    this.state.extractedConfig = mergedConfig
    this.state.progressPercentage = calculateProgress(mergedConfig)

    // Update badge system with conversation context
    const previousBadgeState = this.state.badgeSystem
    this.state.badgeSystem = calculateBadgeProgress(mergedConfig, this.state.conversationHistory)

    // Check for newly earned badges (prevent duplicates)
    const newlyEarnedBadges = this.state.badgeSystem.badges.filter(badge => 
      badge.earned && !previousBadgeState.badges.find(prev => prev.id === badge.id && prev.earned)
    )

    // Improved badge animation management
    if (newlyEarnedBadges.length > 0 && !this.state.pendingBadgeAnimation) {
      // Find the first badge that hasn't had its animation played yet
      const unanimatedBadge = newlyEarnedBadges.find(badge => !badge.animationPlayed)
      if (unanimatedBadge) {
        // Create a new badge object to avoid mutation
        const updatedBadge = { ...unanimatedBadge, animationPlayed: true }

        // Set pending animation
        this.state.pendingBadgeAnimation = updatedBadge.id

        // Update the badge state in the system immutably
        const badgeIndex = this.state.badgeSystem.badges.findIndex(b => b.id === updatedBadge.id)
        if (badgeIndex >= 0) {
          this.state.badgeSystem.badges = [
            ...this.state.badgeSystem.badges.slice(0, badgeIndex),
            updatedBadge,
            ...this.state.badgeSystem.badges.slice(badgeIndex + 1)
          ]
        }
      }
    }

    // Update persona stage progression
    const newPersonaStage = calculateCurrentStage(this.state.badgeSystem.totalEarned)
    if (newPersonaStage !== this.state.personaStage) {
      this.state.previousPersonaStage = this.state.personaStage
      this.state.personaStage = newPersonaStage
      this.state.stageJustAdvanced = true
    } else {
      this.state.stageJustAdvanced = false
    }

    // Handle chip validation triggers
    if (needsChipValidation || result.reflectionCheckpoint) {
      this.state.showChipSelector = true
      this.state.reflectionActive = true
      this.state.chipValidationComplete = false
      this.state.currentStage = 'reflection_checkpoint'
    }

    // Update stage if not in forced validation
    if (!this.state.reflectionActive) {
      this.state.currentStage = determineStage(
        this.state.messageCount,
        this.state.fieldsCollected,
        this.state.chipValidationComplete
      )
    }

    // Calculate UI state
    const uiState = calculateUIState(this.state.currentStage, this.state.reflectionActive)
    this.state.showCompleteButton = uiState.showCompleteButton
    this.state.readyForCompletion = uiState.showCompleteButton

    return { ...this.state }
  }



  // Enhanced quality analysis methods
  analyzeConversationQuality(): Record<string, number> {
    const metrics: Record<string, number> = {}

    // Conversation depth analysis
    metrics.averageMessageLength = this.state.conversationHistory.reduce((sum, msg) => sum + msg.length, 0) / 
      Math.max(this.state.conversationHistory.length, 1)

    // Topic coverage analysis
    const topicKeywords = {
      tone: /tone|style|voice|speak|sound|approach|manner/i,
      audience: /audience|followers|viewers|readers|customers|fans|people/i,
      goals: /goal|objective|purpose|want|help|achieve|accomplish/i,
      boundaries: /boundaries|limits|won't|shouldn't|avoid|not|restrict/i,
      communication: /communicate|talk|respond|reply|format|length|detail/i
    }

    for (const [topic, regex] of Object.entries(topicKeywords)) {
      const coverage = this.state.conversationHistory.filter(msg => regex.test(msg)).length / 
        Math.max(this.state.conversationHistory.length, 1)
      metrics[`${topic}Coverage`] = coverage
    }

    // Parameter evolution tracking
    if (this.state.extractionHistory.length > 1) {
      const recent = this.state.extractionHistory[this.state.extractionHistory.length - 1]
      const previous = this.state.extractionHistory[this.state.extractionHistory.length - 2]

      let improvements = 0
      let totalFields = 0

      for (const field of ['toneDescription', 'audienceDescription', 'avatarObjective', 'boundaries', 'fallbackReply']) {
        totalFields++
        const recentValue = recent[field] || ''
        const previousValue = previous[field] || ''

        if (typeof recentValue === 'string' && typeof previousValue === 'string') {
          if (recentValue.length > previousValue.length) {
            improvements++
          }
        }
      }

      metrics.parameterImprovement = improvements / totalFields
    }

    this.state.qualityMetrics = metrics
    return metrics
  }

  getConversationInsights(): {
    needsMoreContext: string[]
    strongAreas: string[]
    suggestedQuestions: string[]
  } {
    const metrics = this.analyzeConversationQuality()
    const needsMoreContext: string[] = []
    const strongAreas: string[] = []
    const suggestedQuestions: string[] = []

    // Analyze coverage gaps
    if (metrics.toneCoverage < 0.3) {
      needsMoreContext.push('tone')
      suggestedQuestions.push("How would you describe your communication style?")
    } else {
      strongAreas.push('tone')
    }

    if (metrics.audienceCoverage < 0.3) {
      needsMoreContext.push('audience')
      suggestedQuestions.push("Who are you primarily trying to reach with your content?")
    } else {
      strongAreas.push('audience')
    }

    if (metrics.goalsCoverage < 0.3) {
      needsMoreContext.push('goals')
      suggestedQuestions.push("What's the main goal you want to achieve with your avatar?")
    } else {
      strongAreas.push('goals')
    }

    return { needsMoreContext, strongAreas, suggestedQuestions }
  }

  completeChipValidation(): PersonaChatState {
    this.state.chipValidationComplete = true
    this.state.showChipSelector = false
    this.state.reflectionActive = false
    this.state.chipValidationHistory = {
      lastValidatedAt: this.state.fieldsCollected,
      validationCount: this.state.chipValidationHistory.validationCount + 1
    }

    // Recalculate stage after validation
    this.state.currentStage = determineStage(
      this.state.messageCount,
      this.state.fieldsCollected,
      this.state.chipValidationComplete
    )

    // Update UI state
    const uiState = calculateUIState(this.state.currentStage, this.state.reflectionActive)
    this.state.showCompleteButton = uiState.showCompleteButton
    this.state.readyForCompletion = uiState.showCompleteButton

    return { ...this.state }
  }

  validateProgression(): boolean {
    const requirements = STAGE_REQUIREMENTS[this.state.currentStage]

    return (
      this.state.fieldsCollected >= requirements.minFields &&
      this.state.messageCount >= requirements.minMessages &&
      (!requirements.requiresChipValidation || this.state.chipValidationComplete)
    )
  }

  getState(): PersonaChatState {
    return { ...this.state }
  }

  clearPendingBadgeAnimation(): void {
    this.state.pendingBadgeAnimation = undefined
  }

  reset(): void {
    this.state = {
      fieldsCollected: 0,
      messageCount: 0,
      chipValidationComplete: false,
      chipValidationHistory: { lastValidatedAt: 0, validationCount: 0 },
      showChipSelector: false,
      showCompleteButton: false,
      reflectionActive: false,
      currentStage: 'introduction',
      canProgress: true,
      readyForCompletion: false,
      progressPercentage: 0,
      confidenceScore: 0,
      badgeSystem: calculateBadgeProgress({}),
      pendingBadgeAnimation: undefined,
      personaStage: 'npc',
      stageJustAdvanced: false,
      previousPersonaStage: undefined,
      currentSessionQuestions: 0,
      sessionLimit: 2,
      stageQuestionCount: 0,
      conversationHistory: [],
      extractionHistory: [],
      qualityMetrics: {},
      extractedConfig: {}
    }
  }

  shouldShowChipSelector(): boolean {
    const shouldShow = this.state.fieldsCollected >= 2 && 
           !this.state.chipValidationComplete &&
           this.state.fieldsCollected % 2 === 0; // Every 2 fields

    console.log('[CHIP-TRIGGER]', {
      fieldsCollected: this.state.fieldsCollected,
      chipValidationComplete: this.state.chipValidationComplete,
      modCheck: this.state.fieldsCollected % 2 === 0,
      shouldShow
    });

    return shouldShow;
  }
}