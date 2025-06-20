import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Eye, Star } from 'lucide-react'
import { Button } from './button'

interface SpecialBadgeAnimationProps {
  type: 'preview_unlocked' | 'completion'
  onComplete: () => void
}

const SpecialBadgeAnimation: React.FC<SpecialBadgeAnimationProps> = ({ type, onComplete }) => {
  const config = {
    preview_unlocked: {
      title: 'Persona Preview Unlocked!',
      description: 'You\'ve collected enough personality data. I can now respond in your voice style.',
      icon: Eye,
      color: 'blue'
    },
    completion: {
      title: 'Personality Training Complete!',
      description: 'All personality aspects captured. Ready for full AI avatar setup.',
      icon: Trophy,
      color: 'yellow'
    }
  }

  const currentConfig = config[type]
  const IconComponent = currentConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl"
      >
        {/* Animated Icon */}
        <motion.div
          animate={{ 
            rotate: type === 'completion' ? 360 : 0,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: type === 'completion' ? Infinity : 0, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, repeatType: "reverse" }
          }}
          className={`w-16 h-16 mx-auto mb-4 ${
            currentConfig.color === 'yellow' ? 'bg-yellow-400' : 'bg-blue-500'
          } rounded-full flex items-center justify-center`}
        >
          <IconComponent 
            size={32} 
            className={currentConfig.color === 'yellow' ? 'text-yellow-900' : 'text-white'} 
          />
        </motion.div>

        {/* Sparkle Effects */}
        {type === 'completion' && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360],
                  x: [0, Math.cos(i * 60 * Math.PI / 180) * 100],
                  y: [0, Math.sin(i * 60 * Math.PI / 180) * 100]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
                className="absolute"
                style={{
                  left: '50%',
                  top: '40%'
                }}
              >
                <Star size={16} className="text-yellow-400" />
              </motion.div>
            ))}
          </>
        )}

        <h2 className="text-2xl font-bold mb-2 text-gray-900">{currentConfig.title}</h2>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">{currentConfig.description}</p>

        <Button 
          onClick={onComplete} 
          className={`${
            currentConfig.color === 'yellow' 
              ? 'bg-yellow-500 hover:bg-yellow-600' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white px-6 py-2`}
        >
          {type === 'completion' ? 'Complete Setup' : 'Continue'}
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default SpecialBadgeAnimation