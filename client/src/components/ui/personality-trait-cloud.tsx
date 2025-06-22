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
  type?: 'extracted' | 'adjacent' | 'antonym'
  category?: string
  relatedTo?: string
  confidence?: number
}

interface PersonalityTraitCloudProps {
  initialTraits?: PersonalityTrait[]
  onConfirm?: (selectedTraits: PersonalityTrait[], category?: string) => void
  className?: string
  category?: string
  onComplete?: () => void
  showAntonyms?: boolean
}

const PersonalityTraitCloud: React.FC<PersonalityTraitCloudProps> = ({
  initialTraits = [],
  onConfirm,
  className,
  category = "tone",
  onComplete,
  showAntonyms = true
}) => {
  const [traits, setTraits] = useState<PersonalityTrait[]>(initialTraits)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [newTraitInput, setNewTraitInput] = useState("")
  const [showAddInput, setShowAddInput] = useState(false)

  // Categorize traits by type
  const extractedTraits = traits.filter(trait => trait.type === 'extracted')
  const adjacentTraits = traits.filter(trait => trait.type === 'adjacent')
  const antonymTraits = traits.filter(trait => trait.type === 'antonym')

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
        {/* From our conversation */}
        {extractedTraits.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">From our conversation</h4>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {extractedTraits.map((trait) => (
                  <motion.button
                    key={trait.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleTrait(trait.id)}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      trait.selected
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
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
        )}

        {/* Related traits you might like */}
        {adjacentTraits.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Related traits you might like</h4>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {adjacentTraits.map((trait) => (
                  <motion.button
                    key={trait.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleTrait(trait.id)}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      trait.selected
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    {trait.label}
                    {trait.selected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeTrait(trait.id)
                        }}
                        className="ml-1 hover:bg-green-200 rounded-full p-0.5 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Traits you aren't */}
        {showAntonyms && antonymTraits.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Traits you aren't</h4>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {antonymTraits.map((trait) => (
                  <motion.button
                    key={trait.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleTrait(trait.id)}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      trait.selected
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    {trait.label}
                    {trait.selected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeTrait(trait.id)
                        }}
                        className="ml-1 hover:bg-red-200 rounded-full p-0.5 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Add new trait section */}
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {traits.filter(trait => !['extracted', 'adjacent', 'antonym'].includes(trait.type || '')).map((trait) => (
              <motion.button
                key={trait.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleTrait(trait.id)}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  trait.selected
                    ? "bg-gray-200 text-gray-800 border border-gray-300"
                    : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                )}
              >
                {trait.label}
                {trait.selected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeTrait(trait.id)
                    }}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
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

// Helper function to generate traits from extracted config with limits
const generateTraitsFromExtractedConfig = (config: Partial<AvatarPersonaConfig>): PersonalityTrait[] => {
  const traits: PersonalityTrait[] = [];
  let traitCount = 0;
  const maxTraits = 4; // Limit to 4 extracted traits

  // Extract individual adjectives from toneDescription
  if (config.toneDescription && traitCount < maxTraits) {
    const adjectives = config.toneDescription
      .split(/[,\s]+/)
      .filter(word => word.length > 2)
      .slice(0, 2); // Take only first 2 adjectives

    adjectives.forEach((adjective, index) => {
      if (traitCount < maxTraits) {
        traits.push({ 
          id: `tone-${index}`, 
          label: adjective.charAt(0).toUpperCase() + adjective.slice(1).toLowerCase(), 
          selected: true, 
          type: 'extracted' 
        });
        traitCount++;
      }
    });
  }

  // Add style tags as separate traits
  if (config.styleTags && traitCount < maxTraits) {
    config.styleTags.slice(0, maxTraits - traitCount).forEach((tag, index) => {
      traits.push({ 
        id: `style-${index}`, 
        label: tag, 
        selected: true, 
        type: 'extracted' 
      });
      traitCount++;
    });
  }

  return traits;
};

export default PersonalityTraitCloud
export type { PersonalityTrait }