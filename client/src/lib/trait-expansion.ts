export interface TraitExpansion {
  adjacent: string[]
  antonyms: string[]
  contextual?: string[]
}

export const TRAIT_EXPANSIONS: Record<string, TraitExpansion> = {
  'Friendly': {
    adjacent: ['Warm', 'Welcoming', 'Approachable', 'Sociable', 'Open'],
    antonyms: ['Reserved', 'Distant', 'Aloof', 'Cold', 'Standoffish']
  },
  'Analytical': {
    adjacent: ['Logical', 'Systematic', 'Data-driven', 'Methodical', 'Thorough'],
    antonyms: ['Intuitive', 'Spontaneous', 'Emotional', 'Impulsive', 'Gut-feeling']
  },
  'Creative': {
    adjacent: ['Imaginative', 'Innovative', 'Artistic', 'Original', 'Inventive'],
    antonyms: ['Conventional', 'Traditional', 'Predictable', 'Rigid', 'By-the-book']
  },
  'Humorous': {
    adjacent: ['Witty', 'Playful', 'Light-hearted', 'Entertaining', 'Jovial'],
    antonyms: ['Serious', 'Formal', 'Stern', 'Somber', 'Grave']
  },
  'Professional': {
    adjacent: ['Business-like', 'Formal', 'Structured', 'Polished', 'Corporate'],
    antonyms: ['Casual', 'Informal', 'Relaxed', 'Laid-back', 'Conversational']
  },
  'Empathetic': {
    adjacent: ['Compassionate', 'Understanding', 'Caring', 'Sensitive', 'Supportive'],
    antonyms: ['Detached', 'Indifferent', 'Harsh', 'Unsympathetic', 'Clinical']
  },
  'Direct': {
    adjacent: ['Straightforward', 'Honest', 'Clear', 'Blunt', 'No-nonsense'],
    antonyms: ['Indirect', 'Subtle', 'Diplomatic', 'Evasive', 'Tactful']
  },
  'Energetic': {
    adjacent: ['Dynamic', 'Enthusiastic', 'Vibrant', 'Lively', 'Spirited'],
    antonyms: ['Calm', 'Mellow', 'Subdued', 'Tranquil', 'Low-key']
  },
  'Patient': {
    adjacent: ['Tolerant', 'Understanding', 'Calm', 'Persistent', 'Steady'],
    antonyms: ['Impatient', 'Hasty', 'Quick-tempered', 'Restless', 'Urgent']
  },
  'Supportive': {
    adjacent: ['Encouraging', 'Helpful', 'Nurturing', 'Motivating', 'Uplifting'],
    antonyms: ['Critical', 'Discouraging', 'Harsh', 'Unsupportive', 'Demanding']
  }
}

export function generateContextualTraits(
  coreTraits: string[],
  conversationContext: string[]
): { adjacent: string[], antonyms: string[] } {
  const adjacent = new Set<string>()
  const antonyms = new Set<string>()

  // Add standard expansions
  coreTraits.forEach(trait => {
    const expansion = TRAIT_EXPANSIONS[trait]
    if (expansion) {
      expansion.adjacent.forEach(adj => adjacent.add(adj))
      expansion.antonyms.forEach(ant => antonyms.add(ant))
    }
  })

  // Add contextual traits based on conversation content
  const conversationText = conversationContext.join(' ').toLowerCase()

  if (conversationText.includes('teaching') || conversationText.includes('explain')) {
    adjacent.add('Educational')
    adjacent.add('Instructive')
    adjacent.add('Clarifying')
  }

  if (conversationText.includes('humor') || conversationText.includes('joke')) {
    adjacent.add('Quick-witted')
    adjacent.add('Clever')
    adjacent.add('Amusing')
  }

  if (conversationText.includes('fan') || conversationText.includes('audience')) {
    adjacent.add('Engaging')
    adjacent.add('Relatable')
    adjacent.add('Accessible')
  }

  if (conversationText.includes('technical') || conversationText.includes('complex')) {
    adjacent.add('Detailed')
    adjacent.add('Precise')
    adjacent.add('Expert')
  }

  return {
    adjacent: Array.from(adjacent),
    antonyms: Array.from(antonyms)
  }
}

export function createExpandedTraits(
  initialTraits: PersonalityTrait[],
  conversationHistory: string[],
  options: TraitExpansionOptions = {}
): PersonalityTrait[] {
  const { includeAdjacent = true, includeAntonyms = true } = options

  // Ensure initial traits have proper type
  const markedInitialTraits = initialTraits.map(trait => ({
    ...trait,
    type: trait.type || 'extracted'
  }))

  let expandedTraits = [...markedInitialTraits]

  if (includeAdjacent) {
    const adjacentTraits = generateAdjacentTraits(markedInitialTraits, conversationHistory)
    expandedTraits = [...expandedTraits, ...adjacentTraits]
  }

  if (includeAntonyms) {
    const antonymTraits = generateAntonymTraits(markedInitialTraits)
    expandedTraits = [...expandedTraits, ...antonymTraits]
  }

  return expandedTraits
}

function generateAdjacentTraits(
  baseTraits: PersonalityTrait[],
  conversationHistory: string[]
): PersonalityTrait[] {
  // Enhanced adjacent trait mapping
  const adjacentMap: Record<string, string[]> = {
    'Friendly': ['Warm', 'Welcoming', 'Approachable', 'Sociable'],
    'Humorous': ['Witty', 'Playful', 'Light-hearted', 'Amusing'],
    'Engaging': ['Interactive', 'Enthusiastic', 'Captivating', 'Dynamic'],
    'Analytical': ['Logical', 'Systematic', 'Detail-oriented', 'Methodical'],
    'Creative': ['Innovative', 'Imaginative', 'Original', 'Artistic'],
    'Patient': ['Understanding', 'Calm', 'Tolerant', 'Steady'],
    'Empathetic': ['Compassionate', 'Caring', 'Sensitive', 'Thoughtful'],
    'Direct': ['Straightforward', 'Clear', 'Honest', 'Candid'],
    'Professional': ['Polished', 'Competent', 'Reliable', 'Authoritative'],
    'Casual': ['Relaxed', 'Laid-back', 'Informal', 'Easy-going'],
    'Energetic': ['Vibrant', 'Lively', 'Spirited', 'Enthusiastic'],
    'Thoughtful': ['Reflective', 'Considerate', 'Mindful', 'Deliberate']
  }

  const adjacentTraits: PersonalityTrait[] = []
  let idCounter = 1000

  baseTraits.forEach(trait => {
    const adjacents = adjacentMap[trait.label] || []
    adjacents.slice(0, 3).forEach(adjLabel => {
      adjacentTraits.push({
        id: `adj_${idCounter++}`,
        label: adjLabel,
        selected: false,
        type: 'adjacent'
      })
    })
  })

  return adjacentTraits
}

function generateAntonymTraits(baseTraits: PersonalityTrait[]): PersonalityTrait[] {
  // Enhanced antonym mapping
  const antonymMap: Record<string, string[]> = {
    'Friendly': ['Distant', 'Cold', 'Aloof'],
    'Humorous': ['Serious', 'Dry', 'Formal'],
    'Engaging': ['Passive', 'Withdrawn', 'Reserved'],
    'Patient': ['Impatient', 'Rushed', 'Hasty'],
    'Direct': ['Indirect', 'Vague', 'Ambiguous'],
    'Professional': ['Casual', 'Informal', 'Relaxed'],
    'Empathetic': ['Detached', 'Indifferent', 'Unsympathetic'],
    'Creative': ['Conventional', 'Traditional', 'Rigid'],
    'Analytical': ['Intuitive', 'Emotional', 'Spontaneous'],
    'Energetic': ['Calm', 'Subdued', 'Low-key'],
    'Casual': ['Formal', 'Structured', 'Rigid'],
    'Thoughtful': ['Impulsive', 'Spontaneous', 'Quick']
  }

  const antonymTraits: PersonalityTrait[] = []
  let idCounter = 2000

  baseTraits.forEach(trait => {
    const antonyms = antonymMap[trait.label] || []
    antonyms.slice(0, 2).forEach(antLabel => {
      antonymTraits.push({
        id: `ant_${idCounter++}`,
        label: antLabel,
        selected: false,
        type: 'antonym'
      })
    })
  })

  return antonymTraits
}