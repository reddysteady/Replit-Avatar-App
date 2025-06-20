
import React from 'react'
import { motion } from 'framer-motion'
import { PersonaStage, getStageConfig } from '../../../shared/persona-validation'

interface StageTransitionAnimationProps {
  fromStage: PersonaStage
  toStage: PersonaStage
  onComplete: () => void
}

const StageTransitionAnimation: React.FC<StageTransitionAnimationProps> = ({
  fromStage,
  toStage,
  onComplete
}) => {
  const fromConfig = getStageConfig(fromStage)
  const toConfig = getStageConfig(toStage)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onComplete}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-white rounded-lg p-8 max-w-md mx-4 text-center"
      >
        <div className="mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-6xl mb-2"
          >
            {toConfig.icon}
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {toConfig.name} Unlocked!
          </h2>
        </div>
        
        <p className="text-gray-600 mb-6">
          {toConfig.celebrationCopy}
        </p>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">New Capabilities:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            {toConfig.unlockedParameters.map((param) => (
              <li key={param} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                {param.charAt(0).toUpperCase() + param.slice(1).replace(/([A-Z])/g, ' $1')}
              </li>
            ))}
          </ul>
        </div>
        
        <button
          onClick={onComplete}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  )
}

export default StageTransitionAnimation
