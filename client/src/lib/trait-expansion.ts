
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
  coreTraits: Array<{ id: string, label: string, selected: boolean }>,
  conversationContext: string[],
  options: { includeAdjacent?: boolean, includeAntonyms?: boolean } = {}
): Array<{ id: string, label: string, selected: boolean, category?: string, relatedTo?: string }> {
  const expandedTraits = [...coreTraits]
  
  if (!options.includeAdjacent && !options.includeAntonyms) {
    return expandedTraits
  }
  
  const coreLabels = coreTraits.map(t => t.label)
  const contextualTraits = generateContextualTraits(coreLabels, conversationContext)
  
  coreTraits.forEach(coreTrait => {
    const expansion = TRAIT_EXPANSIONS[coreTrait.label]
    
    if (options.includeAdjacent) {
      // Add standard adjacent traits
      expansion?.adjacent.forEach(adjLabel => {
        expandedTraits.push({
          id: `adj_${coreTrait.id}_${adjLabel.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          label: adjLabel,
          selected: false,
          category: 'adjacent',
          relatedTo: coreTrait.id
        })
      })
      
      // Add contextual adjacent traits
      contextualTraits.adjacent.forEach(adjLabel => {
        if (!expandedTraits.some(t => t.label === adjLabel)) {
          expandedTraits.push({
            id: `ctx_adj_${adjLabel.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            label: adjLabel,
            selected: false,
            category: 'adjacent',
            relatedTo: 'contextual'
          })
        }
      })
    }
    
    if (options.includeAntonyms) {
      expansion?.antonyms.forEach(antLabel => {
        expandedTraits.push({
          id: `ant_${coreTrait.id}_${antLabel.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          label: antLabel,
          selected: false,
          category: 'antonym',
          relatedTo: coreTrait.id
        })
      })
    }
  })
  
  return expandedTraits
}
