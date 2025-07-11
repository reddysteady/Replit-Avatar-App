/**
 * Core persona context for Phase 1 implementation
 */
export interface CorePersonaContext {
  toneProfile: {
    baseline: string;
    whenTeaching: string;
    whenChallenged: string;
  };
  communicationPrefs: string[];
  boundaries: string[];
  audienceDescription: string;
  avatarObjective: string[];
  fallbackReply: string;
}

export interface BigFiveTraits {
  openness: { score: number; confidence: number };
  conscientiousness: { score: number; confidence: number };
  extraversion: { score: number; confidence: number };
  agreeableness: { score: number; confidence: number };
  neuroticism: { score: number; confidence: number };
}

/**
 * Configuration describing an avatar's persona.
 * Updated for Phase 1 core implementation
 */
export interface AvatarPersonaConfig {
  /**
   * Freeform text describing the avatar's tone and overall speaking style.
   */
  toneDescription: string
  /**
   * Individual tone adjectives for trait cloud display.
   */
  toneTraits?: string[]
  /**
   * Additional style keywords to reinforce the desired voice.
   */
  styleTags: string[]
  /**
   * Individual communication preferences for trait cloud display.
   */
  communicationPrefs?: string[]
  /**
   * Topics that the avatar is allowed to discuss.
   */
  allowedTopics: string[]
  /**
   * Topics that must not be discussed by the avatar.
   */
  restrictedTopics: string[]
  /**
   * Default response when a user asks about a restricted topic.
   */
  fallbackReply: string
  /**
   * Main objectives or goals for the avatar's interactions.
   */
  avatarObjective: string[]
  /**
   * Description of the target audience for the avatar.
   */
  audienceDescription: string
  /**
   * Boundaries for the avatar's interactions.
   */
  boundaries?: string[]
  /**
   * Communication preferences for tone and style.
   */
  communicationPrefs?: string[]
  /**
   * Core persona context with structured tone profiles
   */
  corePersona?: CorePersonaContext

  /**
   * Big Five personality assessment
   */
  bigFiveProfile?: BigFiveTraits
}

/**
 * State management for persona sessions
 */
export interface PersonaState {
  sessionId: string;
  userId: string;
  phase: 'core' | 'enhanced' | 'completed';
  parameters: Partial<CorePersonaContext>;
  confidenceScores: Record<string, number>;
  conversationHistory: Array<{role: string, content: string, timestamp: Date}>;
  checkpoints: Array<{timestamp: Date, parameters: Partial<CorePersonaContext>, confidence: number}>;
  completedAt?: Date;
  version: number;
}

/**
 * Error handling result structure
 */
export interface ExtractionResult {
  success: boolean;
  confidence: number;
  fallbackUsed: boolean;
  parameters: Partial<CorePersonaContext>;
  errors?: string[];
}

export interface TraitJustifications {
  toneTraits?: Record<string, string>
  styleTags?: Record<string, string>
  communicationPrefs?: Record<string, string>
}

export interface PersonalityExtractionResponse {
  response: string
  extractedData: Partial<AvatarPersonaConfig>
  isComplete: boolean
  personaMode: 'guidance' | 'blended' | 'persona_preview'
  confidenceScore: number
  transitionMessage?: string
  isFinished?: boolean
  showChipSelector?: boolean
  suggestedTraits?: PersonalityTrait[]
  traitJustifications?: TraitJustifications
  reflectionCheckpoint?: boolean
  sessionState?: any
}