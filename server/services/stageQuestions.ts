
import { PersonaStage } from '../../shared/persona-stages';

interface StageQuestionStrategy {
  stage: PersonaStage;
  questionTypes: ('direct' | 'scenario' | 'example' | 'reflective')[];
  promptTemplates: Record<string, string[]>;
  transitionTriggers: string[];
}

const STAGE_QUESTION_STRATEGIES: StageQuestionStrategy[] = [
  {
    stage: 'npc',
    questionTypes: ['direct'],
    promptTemplates: {
      opening: [
        "What are you building this avatar for?",
        "Tell me about the personality you want to create.",
        "What's the purpose of this digital persona?"
      ]
    },
    transitionTriggers: ['purpose', 'goal', 'avatar', 'personality']
  },
  {
    stage: 'noob',
    questionTypes: ['direct', 'example'],
    promptTemplates: {
      tone: [
        "How would you describe your natural communication style?",
        "If I had to match your vibe, what would that sound like?",
        "What three words capture your communication personality?"
      ],
      style: [
        "What three words would a close friend use for your vibe?",
        "Pick some styles that feel like 'you': formal, casual, witty, warm...",
        "Show me your style by describing your ideal response tone."
      ]
    },
    transitionTriggers: ['style', 'tone', 'personality', 'voice']
  },
  {
    stage: 'pro',
    questionTypes: ['scenario', 'reflective'],
    promptTemplates: {
      boundaries: [
        "Are there any topics you prefer not to talk about?",
        "If someone asks about a topic you avoid, how do you respond?",
        "What are your conversation no-go zones?"
      ],
      communication: [
        "Do you prefer planned responses or adapting on the fly?",
        "How do you handle disagreements in conversation?",
        "What's your approach when someone asks something you can't answer?"
      ]
    },
    transitionTriggers: ['boundary', 'topic', 'avoid', 'approach', 'handle']
  }
];

export function getNextQuestionForStage(
  stage: PersonaStage, 
  conversationHistory: string[],
  extractedParams: string[]
): string | null {
  const strategy = STAGE_QUESTION_STRATEGIES.find(s => s.stage === stage);
  if (!strategy) return null;

  const availableQuestions = Object.values(strategy.promptTemplates).flat();
  const contextualQuestions = availableQuestions.filter(q =>
    !conversationHistory.some(msg => msg.includes(q.slice(0, 20)))
  );

  return contextualQuestions[0] || availableQuestions[0] || null;
}
