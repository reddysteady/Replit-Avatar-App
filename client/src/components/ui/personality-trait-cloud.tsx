
"use client"

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface PersonalityTrait {
  id: string
  label: string
  selected: boolean
  category?: 'core' | 'adjacent' | 'antonym'
  relatedTo?: string // ID of the core trait this relates to
}

interface PersonalityTraitCloudProps {
  initialTraits?: PersonalityTrait[]
  onConfirm?: (selectedTraits: PersonalityTrait[]) => void
  className?: string
  includeAdjacent?: boolean
  includeAntonyms?: boolean
}

// Trait expansion mappings
const TRAIT_EXPANSIONS: Record<string, { adjacent: string[], antonyms: string[] }> = {
  'Friendly': {
    adjacent: ['Warm', 'Welcoming', 'Approachable', 'Sociable'],
    antonyms: ['Reserved', 'Distant', 'Aloof', 'Cold']
  },
  'Analytical': {
    adjacent: ['Logical', 'Systematic', 'Data-driven', 'Methodical'],
    antonyms: ['Intuitive', 'Spontaneous', 'Emotional', 'Impulsive']
  },
  'Creative': {
    adjacent: ['Imaginative', 'Innovative', 'Artistic', 'Original'],
    antonyms: ['Conventional', 'Traditional', 'Predictable', 'Rigid']
  },
  'Humorous': {
    adjacent: ['Witty', 'Playful', 'Light-hearted', 'Entertaining'],
    antonyms: ['Serious', 'Formal', 'Stern', 'Somber']
  },
  'Professional': {
    adjacent: ['Business-like', 'Formal', 'Structured', 'Polished'],
    antonyms: ['Casual', 'Informal', 'Relaxed', 'Laid-back']
  },
  'Empathetic': {
    adjacent: ['Compassionate', 'Understanding', 'Caring', 'Sensitive'],
    antonyms: ['Detached', 'Indifferent', 'Harsh', 'Unsympathetic']
  },
  'Direct': {
    adjacent: ['Straightforward', 'Honest', 'Clear', 'Blunt'],
    antonyms: ['Indirect', 'Subtle', 'Diplomatic', 'Evasive']
  }
}

const PersonalityTraitCloud: React.FC<PersonalityTraitCloudProps> = ({
  initialTraits = [],
  onConfirm,
  className,
  includeAdjacent = true,
  includeAntonyms = false,
}) => {
  const [traits, setTraits] = useState<PersonalityTrait[]>(() => {
    if (!includeAdjacent && !includeAntonyms) return initialTraits
    
    const expandedTraits = [...initialTraits]
    
    // Add adjacent and antonym traits
    initialTraits.forEach(coreTrait => {
      const expansions = TRAIT_EXPANSIONS[coreTrait.label]
      if (!expansions) return
      
      if (includeAdjacent) {
        expansions.adjacent.forEach(adjLabel => {
          expandedTraits.push({
            id: `adj_${coreTrait.id}_${adjLabel.toLowerCase()}`,
            label: adjLabel,
            selected: false,
            category: 'adjacent',
            relatedTo: coreTrait.id
          })
        })
      }
      
      if (includeAntonyms) {
        expansions.antonyms.forEach(antLabel => {
          expandedTraits.push({
            id: `ant_${coreTrait.id}_${antLabel.toLowerCase()}`,
            label: antLabel,
            selected: false,
            category: 'antonym',
            relatedTo: coreTrait.id
          })
        })
      }
    })
    
    return expandedTraits
  })
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [newTraitInput, setNewTraitInput] = useState("")
  const [showAddInput, setShowAddInput] = useState(false)
  const [showRelatedTraits, setShowRelatedTraits] = useState<Record<string, boolean>>({})

  const toggleTrait = (id: string) => {
    setTraits(prev => 
      prev.map(trait => 
        trait.id === id ? { ...trait, selected: !trait.selected } : trait
      )
    )
  }

  const addNewTrait = () => {
    if (newTraitInput.trim()) {
      const newTrait: PersonalityTrait = {
        id: Date.now().toString(),
        label: newTraitInput.trim(),
        selected: true
      }
      setTraits(prev => [...prev, newTrait])
      setNewTraitInput("")
      setShowAddInput(false)
    }
  }

  const removeTrait = (id: string) => {
    setTraits(prev => prev.filter(trait => trait.id !== id))
  }

  const handleConfirm = () => {
    const selectedTraits = traits.filter(trait => trait.selected)
    onConfirm?.(selectedTraits)
    setIsCollapsed(true)
  }

  const selectedTraits = traits.filter(trait => trait.selected)

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-sm font-medium">AI</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700 mb-2">
              Perfect! I've updated my understanding with these traits:
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedTraits.map((trait) => (
                <span
                  key={trait.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {trait.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white border border-gray-200 rounded-lg p-6 max-w-md shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium">AI</span>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            I've learned these personality traits from our conversation. Please select the ones that feel right and add any I might have missed:
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          {/* Core Traits */}
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Core Traits</h4>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {traits.filter(t => !t.category || t.category === 'core').map((trait) => (
                  <motion.button
                    key={trait.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleTrait(trait.id)}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2",
                      trait.selected
                        ? "bg-blue-100 text-blue-800 border-blue-400"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    )}
                  >
                    {trait.label}
                    {trait.selected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeTrait(trait.id)
                        }}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Adjacent Traits */}
          {includeAdjacent && traits.some(t => t.category === 'adjacent') && (
            <div>
              <h4 className="text-xs font-medium text-green-600 mb-2">Related Traits</h4>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {traits.filter(t => t.category === 'adjacent').map((trait) => (
                    <motion.button
                      key={trait.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleTrait(trait.id)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all border",
                        trait.selected
                          ? "bg-green-50 text-green-700 border-green-300"
                          : "bg-green-25 text-green-600 border-green-200 hover:bg-green-50"
                      )}
                    >
                      {trait.label}
                      {trait.selected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeTrait(trait.id)
                          }}
                          className="ml-1 hover:bg-green-100 rounded-full p-0.5 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Antonym Traits */}
          {includeAntonyms && traits.some(t => t.category === 'antonym') && (
            <div>
              <h4 className="text-xs font-medium text-orange-600 mb-2">Alternative Styles</h4>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {traits.filter(t => t.category === 'antonym').map((trait) => (
                    <motion.button
                      key={trait.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleTrait(trait.id)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all border",
                        trait.selected
                          ? "bg-orange-50 text-orange-700 border-orange-300"
                          : "bg-orange-25 text-orange-600 border-orange-200 hover:bg-orange-50"
                      )}
                    >
                      {trait.label}
                      {trait.selected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeTrait(trait.id)
                          }}
                          className="ml-1 hover:bg-orange-100 rounded-full p-0.5 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <AnimatePresence>

          {showAddInput ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1"
            >
              <input
                type="text"
                value={newTraitInput}
                onChange={(e) => setNewTraitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addNewTrait()
                  } else if (e.key === "Escape") {
                    setShowAddInput(false)
                    setNewTraitInput("")
                  }
                }}
                placeholder="New trait..."
                className="px-2 py-1 text-sm border border-gray-300 rounded-full outline-none focus:border-blue-500 min-w-0 w-24"
                autoFocus
              />
              <button
                onClick={addNewTrait}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Plus size={12} />
              </button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowAddInput(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-dashed border-gray-400 hover:bg-gray-200 transition-colors"
            >
              <Plus size={14} />
              Add trait
            </motion.button>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default PersonalityTraitCloud
export type { PersonalityTrait }
