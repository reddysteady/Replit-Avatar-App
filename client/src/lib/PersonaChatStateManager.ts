
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
      extractedConfig: {}
    }
  }

  updateFromExtraction(result: ExtractionResult, newMessageCount: number): PersonaChatState {
    const previousFieldCount = this.state.fieldsCollected
    const mergedConfig = { ...this.state.extractedConfig, ...result.extractedData }
    const newFieldCount = countValidFields(mergedConfig)

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

    // Update badge system
    const previousBadgeState = this.state.badgeSystem
    this.state.badgeSystem = calculateBadgeProgress(mergedConfig)

    // Check for newly earned badges
    const newlyEarnedBadges = this.state.badgeSystem.badges.filter(badge => 
      badge.earned && !previousBadgeState.badges.find(prev => prev.id === badge.id && prev.earned)
    )

    if (newlyEarnedBadges.length > 0) {
      this.state.pendingBadgeAnimation = newlyEarnedBadges[0].id
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
      extractedConfig: {}
    }
  }
}
