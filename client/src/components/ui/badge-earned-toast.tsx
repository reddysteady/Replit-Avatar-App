
import React from 'react'
import { motion } from 'framer-motion'
import { 
  MessageCircle, 
  Sparkles, 
  Users, 
  Target, 
  Shield, 
  MessageSquare, 
  Award,
  Trophy
} from 'lucide-react'

interface BadgeEarnedToastProps {
  badge: {
    id: string
    label: string
    category: string
  }
  onClose: () => void
}

const iconMap = {
  tone: MessageCircle,
  style: Sparkles,
  audience: Users,
  objective: Target,
  boundaries: Shield,
  communication: MessageSquare,
}

export const BadgeEarnedToast: React.FC<BadgeEarnedToastProps> = ({ badge, onClose }) => {
  const IconComponent = iconMap[badge.category as keyof typeof iconMap] || Award

  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      className="fixed bottom-4 right-4 z-50 bg-white border border-yellow-200 shadow-lg rounded-lg p-4 max-w-sm"
    >
      <div className="flex items-center gap-3">
        <div className="bg-yellow-400 text-yellow-900 p-2 rounded-full">
          <Trophy size={20} />
        </div>
        <div>
          <div className="font-semibold text-gray-900">Badge Earned!</div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <IconComponent size={14} />
            <span>{badge.label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default BadgeEarnedToast
