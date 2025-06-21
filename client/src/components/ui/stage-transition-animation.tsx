import React from 'react'
import { motion } from 'framer-motion'
import { PersonaStage, PERSONA_STAGES } from "../../../shared/persona-stages"

interface StageTransitionAnimationProps {
  fromStage: PersonaStage
  toStage: PersonaStage
  onComplete?: () => void
}

export function StageTransitionAnimation({ fromStage, toStage, onComplete }: StageTransitionAnimationProps) {
  const toStageConfig = PERSONA_STAGES[toStage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`bg-gradient-to-r ${toStageConfig.gradient} p-8 rounded-lg shadow-xl text-center max-w-md animate-in zoom-in-50 duration-500`}>
        <div className="text-6xl mb-4 animate-bounce">
          {toStageConfig.icon}
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {toStageConfig.name} Unlocked!
        </h2>
        <p className="text-gray-600 mb-4">
          {toStageConfig.celebrationCopy}
        </p>
        <button 
          onClick={onComplete}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Journey
        </button>
      </div>
    </div>
  );
}