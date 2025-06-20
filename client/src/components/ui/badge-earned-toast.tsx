import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy } from 'lucide-react'
import { BadgeState } from '../../../../shared/persona-validation'

interface BadgeEarnedToastProps {
  badge: BadgeState
  onClose: () => void
  triggerContext?: string
}

export const BadgeEarnedToast: React.FC<BadgeEarnedToastProps> = ({ badge, onClose, triggerContext }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  const getBadgeLabel = (badgeId: string) => {
    const labels = {
      tone: 'Tone Master',
      style: 'Style Curator',
      audience: 'Audience Expert',
      objective: 'Goal Setter',
      boundaries: 'Boundary Keeper',
      communication: 'Communication Pro'
    }
    return labels[badgeId as keyof typeof labels] || 'Badge'
  }

  const getBadgeDescription = (badgeId: string) => {
    const descriptions = {
      tone: 'Defined your communication tone',
      style: 'Collected 2+ style preferences',
      audience: 'Described your target audience',
      objective: 'Set your avatar objectives',
      boundaries: 'Established content boundaries',
      communication: 'Refined communication preferences'
    }
    return descriptions[badgeId as keyof typeof descriptions] || 'Achievement unlocked!'
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed bottom-4 right-4 z-50 bg-white border border-yellow-200 shadow-lg rounded-lg p-4 max-w-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="bg-yellow-400 text-yellow-900 p-2 rounded-full">
              <Trophy size={20} />
            </div>
            <div>
              <div className="font-semibold text-gray-900">{getBadgeLabel(badge.id)} Earned!</div>
              <div className="text-sm text-gray-600 mt-1">
                {getBadgeDescription(badge.id)}
              </div>
              {triggerContext && (
                <div className="text-xs text-gray-500 mt-1">
                  Triggered by: "{triggerContext.substring(0, 40)}..."
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}