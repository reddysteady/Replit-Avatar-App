
/**
 * Shared validation logic for persona configuration
 * Used by both frontend and backend to ensure consistency
 */

export const CORE_PERSONA_FIELDS = [
  'toneDescription',
  'audienceDescription', 
  'avatarObjective',
  'boundaries',
  'communicationPrefs',
  'fallbackReply'
] as const

export type CorePersonaField = typeof CORE_PERSONA_FIELDS[number]

export interface AvatarPersonaConfig {
  toneDescription?: string
  styleTags?: string[]
  allowedTopics?: string[]
  restrictedTopics?: string[]
  fallbackReply?: string
  avatarObjective?: string[]
  audienceDescription?: string
  boundaries?: string[]
  communicationPrefs?: {
    verbosity: 'concise' | 'detailed' | 'balanced'
    formality: 'formal' | 'casual' | 'mixed'
  }
}

export function countValidFields(config: Partial<AvatarPersonaConfig>): number {
  return CORE_PERSONA_FIELDS.filter(field => {
    const value = config[field]
    if (!value) return false
    if (typeof value === 'string') return value.length > 3
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return Object.keys(value).length > 0
    return false
  }).length
}

export function calculateProgress(config: Partial<AvatarPersonaConfig>): number {
  const validFields = countValidFields(config)
  return Math.min(95, (validFields / CORE_PERSONA_FIELDS.length) * 100)
}

export type ProgressionStage = 'introduction' | 'core_collection' | 'reflection_checkpoint' | 'completion'

export interface StageRequirements {
  minFields: number
  minMessages: number
  requiresChipValidation: boolean
  allowsCompletion: boolean
}

export const STAGE_REQUIREMENTS: Record<ProgressionStage, StageRequirements> = {
  introduction: { minFields: 0, minMessages: 0, requiresChipValidation: false, allowsCompletion: false },
  core_collection: { minFields: 0, minMessages: 1, requiresChipValidation: false, allowsCompletion: false },
  reflection_checkpoint: { minFields: 2, minMessages: 3, requiresChipValidation: true, allowsCompletion: false },
  completion: { minFields: 4, minMessages: 6, requiresChipValidation: true, allowsCompletion: true }
}

export function determineStage(
  messageCount: number, 
  fieldsCollected: number, 
  chipValidationComplete: boolean
): ProgressionStage {
  // Never allow backward progression
  // Only advance when ALL requirements for next stage are met

  if (fieldsCollected >= 4 && messageCount >= 6 && chipValidationComplete) {
    return 'completion'
  }

  if (fieldsCollected >= 2 && messageCount >= 3 && (fieldsCollected % 2 === 0)) {
    return 'reflection_checkpoint'
  }

  if (messageCount >= 1) {
    return 'core_collection'
  }

  return 'introduction'
}

export interface UIState {
  showCompleteButton: boolean
  showChipSelector: boolean
  inputDisabled: boolean
  personaMode: 'guidance' | 'blended' | 'persona_preview'
}

export function calculateUIState(stage: ProgressionStage, reflectionActive: boolean): UIState {
  switch (stage) {
    case 'reflection_checkpoint':
      return {
        showCompleteButton: false,
        showChipSelector: true,
        inputDisabled: true, // Force chip interaction first
        personaMode: 'blended'
      }

    case 'completion':
      return {
        showCompleteButton: true,
        showChipSelector: false,
        inputDisabled: false,
        personaMode: 'persona_preview'
      }

    default:
      return {
        showCompleteButton: false,
        showChipSelector: false,
        inputDisabled: false,
        personaMode: 'guidance'
      }
  }
}

export interface ChipValidationHistory {
  lastValidatedAt: number // field count when last validated
  validationCount: number
}

export function shouldTriggerChipValidation(
  previousFieldCount: number, 
  newFieldCount: number,
  hasValidatedRecently: boolean
): boolean {
  // Trigger chip validation every 2 fields collected
  const previousMilestone = Math.floor(previousFieldCount / 2)
  const newMilestone = Math.floor(newFieldCount / 2)

  // Only trigger if we crossed a milestone and haven't validated recently
  return newMilestone > previousMilestone && !hasValidatedRecently
}
