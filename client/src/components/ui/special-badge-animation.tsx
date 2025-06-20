
import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Trophy, Star } from 'lucide-react'

interface SpecialBadgeAnimationProps {
  type: 'preview_unlocked' | 'completion'
  onComplete: () => void
}

export const SpecialBadgeAnimation: React.FC<SpecialBadgeAnimationProps> = ({ type, onComplete }) => {
  const isCompletion = type === 'completion'
  
  React.useEffect(() => {
    const timer = setTimeout(onComplete, 3000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ 
          scale: [0, 1.2, 1],
          rotate: [0, 360],
        }}
        transition={{
          duration: 1.5,
          ease: "easeOut"
        }}
        className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-8 py-6 rounded-xl shadow-2xl text-center"
      >
        {isCompletion ? (
          <>
            <div className="flex justify-center mb-3">
              <Trophy size={48} className="text-yellow-100" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Personality v1 Complete!</h2>
            <p className="text-yellow-100">All badges earned - your AI persona is ready!</p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-3">
              <div className="relative">
                <Star size={48} className="text-yellow-100" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles size={16} className="text-yellow-200" />
                </motion.div>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Persona Preview Unlocked!</h2>
            <p className="text-yellow-100">You can now test your AI personality</p>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

export default SpecialBadgeAnimation
