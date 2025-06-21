// Import AvatarPersonaConfig type
import type { AvatarPersonaConfig } from '../client/src/types/AvatarPersonaConfig'

// Badge state interface
export interface BadgeState {
  id: string
  earned: boolean
  earnedAt?: Date
  animationPlayed: boolean
  category: string
  threshold: number
}

// Badge configurations
export interface BadgeConfig {
  id: string
  category: string
  threshold: number
  name: string
  description: string
}

export const BADGE_CONFIGS: BadgeConfig[] = [
  {
    id: 'tone',
    category: 'toneDescription',
    threshold: 1,
    name: 'Tone Master',
    description: 'Defined communication tone'
  },
  {
    id: 'style',
    category: 'styleTags',
    threshold: 2,
    name: 'Style Curator',
    description: 'Selected style tags'
  },
  {
    id: 'audience',
    category: 'audienceDescription',
    threshold: 1,
    name: 'Audience Expert',
    description: 'Described target audience'
  },
  {
    id: 'objective',
    category: 'avatarObjective',
    threshold: 1,
    name: 'Goal Setter',
    description: 'Set avatar objectives'
  },
  {
    id: 'boundaries',
    category: 'boundaries',
    threshold: 1,
    name: 'Boundary Keeper',
    description: 'Established boundaries'
  },
  {
    id: 'communication',
    category: 'communicationPrefs',
    threshold: 1,
    name: 'Communication Pro',
    description: 'Communication preferences set'
  }
]

// Persona stages
export interface PersonaStage {
  id: string
  name: string
  icon: string
  badgeRequirement: number
  description: string
}

export const PERSONA_STAGES: PersonaStage[] = [
  {
    id: 'discovering',
    name: 'Discovering',
    icon: '🔍',
    badgeRequirement: 0,
    description: 'Starting to learn about your personality'
  },
  {
    id: 'learning',
    name: 'Learning',
    icon: '📚',
    badgeRequirement: 2,
    description: 'Understanding your communication style'
  },
  {
    id: 'adapting',
    name: 'Adapting',
    icon: '🎭',
    badgeRequirement: 4,
    description: 'Adapting to your preferences'
  },
  {
    id: 'mastered',
    name: 'Mastered',
    icon: '✨',
    badgeRequirement: 6,
    description: 'Fully configured persona'
  }
]

// Additional types needed by PersonaChatStateManager
export type ProgressionStage = 'introduction' | 'discovery' | 'refinement' | 'reflection_checkpoint' | 'completion'
export type UIState = { showCompleteButton: boolean }
export type PersonaStage = 'npc' | 'character' | 'assistant' | 'persona'

export interface ChipValidationHistory {
  lastValidatedAt: number
  validationCount: number
}

export interface BadgeSystemState {
  badges: BadgeState[]
  totalEarned: number
  canActivatePreview: boolean
  canComplete: boolean
}

export const STAGE_REQUIREMENTS: Record<ProgressionStage, { minFields: number; minMessages: number; requiresChipValidation?: boolean }> = {
  introduction: { minFields: 0, minMessages: 0 },
  discovery: { minFields: 1, minMessages: 2 },
  refinement: { minFields: 3, minMessages: 5 },
  reflection_checkpoint: { minFields: 4, minMessages: 8, requiresChipValidation: true },
  completion: { minFields: 6, minMessages: 10, requiresChipValidation: true }
}

// Helper functions



export function countValidFields(config: Partial<AvatarPersonaConfig>): number {
  let count = 0
  if (config.toneDescription && config.toneDescription.length > 0) count++
  if (config.styleTags && config.styleTags.length > 0) count++
  if (config.audienceDescription && config.audienceDescription.length > 0) count++
  if (config.avatarObjective && config.avatarObjective.length > 0) count++
  if (config.boundaries && config.boundaries.length > 0) count++
  if (config.communicationPrefs && config.communicationPrefs.length > 0) count++
  return count
}

export function calculateProgress(config: Partial<AvatarPersonaConfig>): number {
  const totalFields = 6 // Total number of fields we track
  const validFields = countValidFields(config)
  return Math.round((validFields / totalFields) * 100)
}

export function determineStage(messageCount: number, fieldCount: number, chipValidationComplete: boolean): ProgressionStage {
  if (fieldCount >= 6 && chipValidationComplete) return 'completion'
  if (fieldCount >= 4 && messageCount >= 8) return 'reflection_checkpoint'
  if (fieldCount >= 3 && messageCount >= 5) return 'refinement'
  if (fieldCount >= 1 && messageCount >= 2) return 'discovery'
  return 'introduction'
}

export function calculateUIState(stage: ProgressionStage, reflectionActive: boolean): UIState {
  return {
    showCompleteButton: stage === 'completion' && !reflectionActive
  }
}

export function shouldTriggerChipValidation(previousFields: number, newFields: number, validationComplete: boolean): boolean {
  return newFields >= 4 && previousFields < 4 && !validationComplete
}

export function calculateCurrentStage(badgeCount: number): PersonaStage {
  if (badgeCount >= 6) return 'persona'
  if (badgeCount >= 4) return 'assistant'
  if (badgeCount >= 2) return 'character'
  return 'npc'
}

export function getStageConfig(stage: PersonaStage) {
  const stageMap = {
    'npc': { name: 'NPC', icon: '🤖', description: 'Blank Slate' },
    'character': { name: 'Character', icon: '🎭', description: 'Voice Formation' },
    'assistant': { name: 'Assistant', icon: '🎯', description: 'Boundary Setting' },
    'persona': { name: 'Persona', icon: '✨', description: 'Voice Mastery' }
  }
  return stageMap[stage] || stageMap['npc']
}

export function calculateBadgeProgress(config: Partial<AvatarPersonaConfig>): BadgeSystemState {
  const badges: BadgeState[] = BADGE_CONFIGS.map(badgeConfig => {
    let earned = false
    const value = config[badgeConfig.category]
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[BADGE-CHECK] Category: ${badgeConfig.category}, Value:`, value, `Threshold: ${badgeConfig.threshold}`)
    }
    
    switch (badgeConfig.category) {
      case 'toneDescription':
        earned = Boolean(config.toneDescription && typeof config.toneDescription === 'string' && config.toneDescription.trim().length > 0)
        break
      case 'styleTags':
        earned = Boolean(config.styleTags && Array.isArray(config.styleTags) && config.styleTags.length >= badgeConfig.threshold)
        break
      case 'audienceDescription':
        earned = Boolean(config.audienceDescription && typeof config.audienceDescription === 'string' && config.audienceDescription.trim().length > 0)
        break
      case 'avatarObjective':
        earned = Boolean(config.avatarObjective && typeof config.avatarObjective === 'string' && config.avatarObjective.trim().length > 0)
        break
      case 'boundaries':
        earned = Boolean(config.boundaries && typeof config.boundaries === 'string' && config.boundaries.trim().length > 0)
        break
      case 'communicationPrefs':
        earned = Boolean(config.communicationPrefs && typeof config.communicationPrefs === 'string' && config.communicationPrefs.trim().length > 0)
        break
      default:
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[BADGE-CHECK] Default false for:`, value)
        }
        earned = false
    }
    
    return {
      id: badgeConfig.id,
      earned,
      earnedAt: earned ? new Date() : undefined,
      animationPlayed: false,
      category: badgeConfig.category,
      threshold: badgeConfig.threshold
    }
  })
  
  const totalEarned = badges.filter(b => b.earned).length
  
  return {
    badges,
    totalEarned,
    canActivatePreview: totalEarned >= 3,
    canComplete: totalEarned >= 6
  }
}