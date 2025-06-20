import React from 'react'
import { motion } from 'framer-motion'
import { 
  MessageCircle, 
  Sparkles, 
  Users, 
  Target, 
  Shield, 
  MessageSquare, 
  Award 
} from 'lucide-react'
import { BadgeState, BADGE_CONFIGS } from '../../../../shared/persona-validation'

interface BadgeHeaderProps {
  badges: BadgeState[]
}

const iconMap = {
  toneDescription: MessageCircle,
  styleTags: Sparkles,
  audienceDescription: Users,
  avatarObjective: Target,
  boundaries: Shield,
  communicationPrefs: MessageSquare,
}

export const BadgeHeader: React.FC<BadgeHeaderProps> = ({ badges }) => {
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
  const currentStage = calculateCurrentStage(earnedBadges.length)
  const stageConfig = getStageConfig(currentStage)
  const nextStage = PERSONA_STAGES.find(s => s.badgeRequirement > earnedBadges.length)

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{stageConfig.icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">{stageConfig.name}</h3>
            {nextStage && (
              <p className="text-xs text-gray-500">
                {nextStage.badgeRequirement - earnedBadges.length} badges to {nextStage.name}
              </p>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-500">{earnedBadges.length}/6 Badges Earned</span>
      </div>
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
                {badge.id === 'tone' && 'Tone Master'}
                {badge.id === 'style' && 'Style Curator'}
                {badge.id === 'audience' && 'Audience Expert'}
                {badge.id === 'objective' && 'Goal Setter'}
                {badge.id === 'boundaries' && 'Boundary Keeper'}
                {badge.id === 'communication' && 'Communication Pro'}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default BadgeHeader