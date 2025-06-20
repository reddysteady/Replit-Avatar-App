
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

interface Badge {
  id: string
  label: string
  category: string
}

interface BadgeAnimationProps {
  badge: Badge
  onComplete: () => void
}

const iconMap = {
  tone: MessageCircle,
  style: Sparkles,
  audience: Users,
  objective: Target,
  boundaries: Shield,
  communication: MessageSquare,
}

export const BadgeAnimation: React.FC<BadgeAnimationProps> = ({ badge, onComplete }) => {
  const IconComponent = iconMap[badge.category as keyof typeof iconMap] || Award

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{
        scale: [0, 1.2, 1],
        rotate: [0, 360],
        y: [0, -200]
      }}
      transition={{
        duration: 2,
        times: [0, 0.3, 1],
        ease: "easeOut"
      }}
      onAnimationComplete={onComplete}
      className="absolute z-50 left-1/2 transform -translate-x-1/2 pointer-events-none"
    >
      <div className="bg-yellow-400 text-yellow-900 px-3 py-2 rounded-full shadow-lg flex items-center gap-2">
        <IconComponent size={16} />
        <span className="text-sm font-bold">{badge.label}</span>
      </div>
    </motion.div>
  )
}

export default BadgeAnimation
