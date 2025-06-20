// Persona stages configuration
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