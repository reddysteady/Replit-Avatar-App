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

export interface TraitExpansionOptions {
  includeAdjacent?: boolean
  includeAntonyms?: boolean
}

export interface PersonalityTrait {
  id: string
  label: string
  selected: boolean
  type?: 'extracted' | 'adjacent' | 'antonym'
}

export function createExpandedTraits(
  initialTraits: PersonalityTrait[],
  conversationHistory: string[],
  options: TraitExpansionOptions = {}
): PersonalityTrait[] {
  const { includeAdjacent = true, includeAntonyms = true } = options

  console.log('[TRAIT-EXPANSION] createExpandedTraits called with:', {
    initialTraitsCount: initialTraits.length,
    initialTraits: initialTraits.map(t => ({ label: t.label, type: t.type, selected: t.selected })),
    includeAdjacent,
    includeAntonyms,
    conversationHistoryLength: conversationHistory.length,
    conversationSample: conversationHistory.slice(0, 2).map(msg => msg.substring(0, 50))
  })

  // Ensure initial traits have proper type
  const markedInitialTraits = initialTraits.map(trait => ({
    ...trait,
    type: (trait.type || 'extracted') as 'extracted' | 'adjacent' | 'antonym'
  }))

  let expandedTraits = [...markedInitialTraits]
  console.log('[TRAIT-EXPANSION] Starting with marked initial traits:', markedInitialTraits)

  if (includeAdjacent) {
    console.log('[TRAIT-EXPANSION] Generating adjacent traits...')
    const adjacentTraits = generateAdjacentTraits(markedInitialTraits, conversationHistory)
    console.log('[TRAIT-EXPANSION] Generated adjacent traits:', adjacentTraits)
    expandedTraits = [...expandedTraits, ...adjacentTraits]
    console.log('[TRAIT-EXPANSION] Traits after adding adjacent:', expandedTraits.length)
  } else {
    console.log('[TRAIT-EXPANSION] Skipping adjacent traits (includeAdjacent=false)')
  }

  if (includeAntonyms) {
    console.log('[TRAIT-EXPANSION] Generating antonym traits...')
    const antonymTraits = generateAntonymTraits(markedInitialTraits)
    console.log('[TRAIT-EXPANSION] Generated antonym traits:', antonymTraits)
    expandedTraits = [...expandedTraits, ...antonymTraits]
    console.log('[TRAIT-EXPANSION] Traits after adding antonyms:', expandedTraits.length)
  } else {
    console.log('[TRAIT-EXPANSION] Skipping antonym traits (includeAntonyms=false)')
  }

  const finalBreakdown = {
    total: expandedTraits.length,
    extracted: expandedTraits.filter(t => t.type === 'extracted').length,
    adjacent: expandedTraits.filter(t => t.type === 'adjacent').length,
    antonym: expandedTraits.filter(t => t.type === 'antonym').length
  }
  
  console.log('[TRAIT-EXPANSION] Final expanded traits breakdown:', finalBreakdown)
  console.log('[TRAIT-EXPANSION] Final traits by type:', {
    extracted: expandedTraits.filter(t => t.type === 'extracted').map(t => t.label),
    adjacent: expandedTraits.filter(t => t.type === 'adjacent').map(t => t.label),
    antonym: expandedTraits.filter(t => t.type === 'antonym').map(t => t.label)
  })

  return expandedTraits
}

function generateAdjacentTraits(
  baseTraits: PersonalityTrait[],
  conversationHistory: string[]
): PersonalityTrait[] {
  console.log('[TRAIT-EXPANSION] generateAdjacentTraits called with base traits:', baseTraits.map(t => t.label))
  
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
    'Thoughtful': ['Reflective', 'Considerate', 'Mindful', 'Deliberate'],
    'Authentic': ['Genuine', 'Honest', 'Real', 'Sincere'],
    'Responsive': ['Attentive', 'Quick', 'Reactive', 'Alert'],
    'Helpful': ['Supportive', 'Useful', 'Assisting', 'Beneficial'],
    'Casual': ['Informal', 'Relaxed', 'Easy-going', 'Comfortable']
  }

  const adjacentTraits: PersonalityTrait[] = []
  let idCounter = 1000

  baseTraits.forEach(trait => {
    const adjacents = adjacentMap[trait.label] || []
    console.log('[TRAIT-EXPANSION] For trait', trait.label, 'found adjacents:', adjacents)
    
    // Take 2-3 adjacent traits per base trait
    adjacents.slice(0, 3).forEach(adjLabel => {
      adjacentTraits.push({
        id: `adj_${idCounter++}`,
        label: adjLabel,
        selected: false,
        type: 'adjacent' as const
      })
    })
  })

  console.log('[TRAIT-EXPANSION] Generated adjacent traits:', adjacentTraits)
  return adjacentTraits
}

function generateAntonymTraits(baseTraits: PersonalityTrait[]): PersonalityTrait[] {
  console.log('[TRAIT-EXPANSION] generateAntonymTraits called with base traits:', baseTraits.map(t => t.label))
  
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
    'Thoughtful': ['Impulsive', 'Spontaneous', 'Quick'],
    'Authentic': ['Fake', 'Artificial', 'Insincere'],
    'Responsive': ['Unresponsive', 'Slow', 'Delayed'],
    'Helpful': ['Unhelpful', 'Obstructive', 'Hindering']
  }

  const antonymTraits: PersonalityTrait[] = []
  let idCounter = 2000

  baseTraits.forEach(trait => {
    const antonyms = antonymMap[trait.label] || []
    console.log('[TRAIT-EXPANSION] For trait', trait.label, 'found antonyms:', antonyms)
    
    // Take 2 antonym traits per base trait
    antonyms.slice(0, 2).forEach(antLabel => {
      antonymTraits.push({
        id: `ant_${idCounter++}`,
        label: antLabel,
        selected: false,
        type: 'antonym' as const
      })
    })
  })

  console.log('[TRAIT-EXPANSION] Generated antonym traits:', antonymTraits)
  return antonymTraits
}