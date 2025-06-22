import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageCircle, 
  Sparkles, 
  Users, 
  Target, 
  Shield, 
  MessageSquare, 
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { 
  BADGE_CONFIGS, 
  PERSONA_STAGES 
} from '../../lib/constants'

interface BadgeState {
  id: string
  earned: boolean
  earnedAt?: Date
  animationPlayed: boolean
  category: string
  threshold: number
}

interface BadgeHeaderProps {
  badges: BadgeState[]
}

const iconMap = {
  avatarObjective: Target,
  audienceDescription: Users,
  toneDescription: MessageCircle,
  styleTags: Sparkles,
  boundaries: Shield,
  communicationPrefs: MessageSquare,
}

export const BadgeHeader: React.FC<BadgeHeaderProps> = ({ badges }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Always show all badges, create missing ones
  const allBadges = BADGE_CONFIGS.map(config => {
    const existingBadge = badges.find(b => b.id === config.id)
    return existingBadge || {
      id: config.id,
      earned: false,
      earnedAt: undefined,
      animationPlayed: false,
      category: config.category,
      threshold: config.threshold
    }
  })

  const earnedBadges = allBadges.filter(badge => badge.earned)
  const stageConfig = PERSONA_STAGES.find(s => {
    if (earnedBadges.length >= 6) return s.id === 'mastered'
    if (earnedBadges.length >= 4) return s.id === 'adapting'
    if (earnedBadges.length >= 2) return s.id === 'learning'
    return s.id === 'discovering'
  }) || PERSONA_STAGES[0]
  const nextStage = PERSONA_STAGES.find(s => s.badgeRequirement > earnedBadges.length)

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200">
      {/* Compact header - always visible */}
      <div 
        className="flex items-center justify-between p-2 cursor-pointer md:cursor-default md:p-3" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{stageConfig.icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">{stageConfig.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{earnedBadges.length}/6 Badges</span>
              {nextStage && !isExpanded && (
                <span className="text-xs text-gray-500 hidden sm:inline">
                  • {nextStage.badgeRequirement - earnedBadges.length} to {nextStage.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress bar on mobile */}
          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden md:hidden">
            <div 
              className="h-full bg-yellow-400 transition-all duration-300"
              style={{ width: `${(earnedBadges.length / 6) * 100}%` }}
            />
          </div>
          {/* Toggle button - mobile only */}
          <button className="md:hidden p-1">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expandable content - hidden on mobile by default, always visible on desktop */}
      <motion.div
        initial={false}
        animate={{ 
          height: isExpanded || window.innerWidth >= 768 ? 'auto' : 0,
          opacity: isExpanded || window.innerWidth >= 768 ? 1 : 0
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden md:!h-auto md:!opacity-100"
      >
        <div className="px-2 pb-2 md:px-3 md:pb-3">
          {nextStage && (
            <p className="text-xs text-gray-500 mb-2 md:hidden">
              {nextStage.badgeRequirement - earnedBadges.length} badges to {nextStage.name}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {allBadges.map((badge) => {
              const IconComponent = iconMap[badge.category as keyof typeof iconMap] || Award

              return (
                <motion.div
                  key={badge.id}
                  initial={badge.earned ? { scale: 0 } : false}
                  animate={badge.earned ? { scale: 1 } : false}
                  transition={{ delay: 0.5, type: "spring" }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    badge.earned
                      ? 'bg-yellow-400 text-yellow-900 shadow-sm'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <IconComponent size={12} />
                  <span className="font-medium">
                    {badge.id === 'objective' && 'Goal Setter'}
                    {badge.id === 'audience' && 'Audience Expert'}
                    {badge.id === 'tone' && 'Tone Master'}
                    {badge.id === 'style' && 'Style Curator'}
                    {badge.id === 'boundaries' && 'Boundary Keeper'}
                    {badge.id === 'communication' && 'Communication Pro'}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default BadgeHeader