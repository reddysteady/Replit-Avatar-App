
interface QualityGate {
  parameter: string;
  minimumConfidence: number;
  requiredDataPoints: number;
  consistencyThreshold: number;
  validationMethod: 'user_confirm' | 'behavior_test' | 'cross_reference';
}

const QUALITY_GATES: Record<string, QualityGate> = {
  bigFivePulse: {
    parameter: 'bigFiveProfile',
    minimumConfidence: 0.7,
    requiredDataPoints: 5,
    consistencyThreshold: 0.8,
    validationMethod: 'cross_reference'
  },
  boundaries: {
    parameter: 'boundaries',
    minimumConfidence: 0.8,
    requiredDataPoints: 3,
    consistencyThreshold: 0.9,
    validationMethod: 'behavior_test'
  },
  toneProfile: {
    parameter: 'toneDescription',
    minimumConfidence: 0.75,
    requiredDataPoints: 2,
    consistencyThreshold: 0.85,
    validationMethod: 'user_confirm'
  }
};

export function validateParameterQuality(
  parameter: string, 
  extraction: any, 
  conversationHistory: string[]
): boolean {
  const gate = QUALITY_GATES[parameter];
  if (!gate) return true;
  
  const confidence = extraction.confidence?.[parameter] || 0;
  const dataPoints = conversationHistory.filter(msg => 
    msg.toLowerCase().includes(parameter.toLowerCase())
  ).length;
  
  return confidence >= gate.minimumConfidence && 
         dataPoints >= gate.requiredDataPoints;
}

export function calculateConfidenceScores(
  extraction: any, 
  conversationHistory: string[]
): Record<string, number> {
  const scores: Record<string, number> = {};
  
  // Calculate confidence based on data richness and consistency
  Object.keys(extraction).forEach(key => {
    const value = extraction[key];
    if (!value) {
      scores[key] = 0;
      return;
    }
    
    let confidence = 0.3; // Base confidence
    
    // Data presence bonus
    if (typeof value === 'string' && value.length > 15) confidence += 0.3;
    if (Array.isArray(value) && value.length > 1) confidence += 0.2;
    
    // Context relevance bonus
    const contextMentions = conversationHistory.filter(msg =>
      msg.toLowerCase().includes(key.toLowerCase())
    ).length;
    confidence += Math.min(contextMentions * 0.1, 0.4);
    
    scores[key] = Math.min(confidence, 1.0);
  });
  
  return scores;
}
