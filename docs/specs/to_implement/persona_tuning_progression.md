
# Integrated Persona Progression Specification

## Overview

This specification integrates the 5-stage persona progression system (NPC → Noob → Pro → Hero → Legend) with the existing badge-based persona tuning chat functionality. The system maintains backward compatibility while adding progressive unlocking of advanced persona parameters based on user engagement and completion milestones.

## 🎮 Persona Progression Integration

### Stage-Badge Mapping

| **Stage** | **Badge Requirement** | **Parameters Unlocked** | **Chat Behavior** | **UI Changes** |
|-----------|----------------------|------------------------|-------------------|----------------|
| **NPC** | 0 badges | Initial Context | Basic introduction prompts | Greyed badges, simple UI |
| **Noob** | 1-2 badges | Tone, Style, Basic Big Five | Direct personality questions | Badge animations, progress visible |
| **Pro** | 3-4 badges | Topics, Boundaries, Fallback | Scenario-based questions | Persona Preview unlocked |
| **Hero** | 5-6 badges | Audience, Signature Phrases | Advanced persona questions | Full customization access |
| **Legend** | All 6 badges + Advanced | Edge Cases, Dynamic Modes | Master-level configuration | Elite status indicators |

### Progressive Parameter Unlocking

```typescript
interface PersonaStage {
  id: string
  name: string
  badgeRequirement: number
  unlockedParameters: (keyof AvatarPersonaConfig)[]
  chatPromptStyle: 'direct' | 'scenario' | 'reflective' | 'advanced'
  icon: string
  celebrationCopy: string
}

const PERSONA_STAGES: PersonaStage[] = [
  {
    id: 'npc',
    name: 'NPC',
    badgeRequirement: 0,
    unlockedParameters: ['initialContext'],
    chatPromptStyle: 'direct',
    icon: '⬛',
    celebrationCopy: "You're a blank slate... but greatness is loading."
  },
  {
    id: 'noob', 
    name: 'Noob',
    badgeRequirement: 1,
    unlockedParameters: ['toneDescription', 'styleTags'],
    chatPromptStyle: 'direct',
    icon: '🐣',
    celebrationCopy: "You've cracked the shell — now we find your voice."
  },
  {
    id: 'pro',
    name: 'Pro', 
    badgeRequirement: 3,
    unlockedParameters: ['boundaries', 'communicationPrefs'],
    chatPromptStyle: 'scenario',
    icon: '🚀',
    celebrationCopy: "Blast off. You've got a voice, and you're moving with purpose."
  },
  {
    id: 'hero',
    name: 'Hero',
    badgeRequirement: 5,
    unlockedParameters: ['audienceDescription', 'avatarObjective'],
    chatPromptStyle: 'reflective',
    icon: '🎖️',
    celebrationCopy: "You've earned your badge. This persona's got presence."
  },
  {
    id: 'legend',
    name: 'Legend',
    badgeRequirement: 6,
    unlockedParameters: ['edgeCases', 'dynamicModes', 'signaturePhrases'],
    chatPromptStyle: 'advanced',
    icon: '🐐',
    celebrationCopy: "Legend unlocked. You've built a digital icon. 🐐"
  }
]
```

## Enhanced Badge System Integration

### Badge-to-Parameter Quality Gates

```typescript
interface EnhancedBadgeConfig extends BadgeConfig {
  stage: string
  qualityGate: (config: Partial<AvatarPersonaConfig>, conversation: string[]) => boolean
  unlockMessage: string
  nextStageHint?: string
}

const ENHANCED_BADGE_CONFIGS: EnhancedBadgeConfig[] = [
  {
    id: 'tone',
    category: 'toneDescription', 
    label: 'Tone Master',
    threshold: 1,
    priority: 1,
    stage: 'noob',
    qualityGate: (config, conversation) => {
      return !!config.toneDescription && 
             config.toneDescription.length > 10 &&
             conversation.some(msg => /tone|voice|style|manner/i.test(msg))
    },
    unlockMessage: "Your communication voice is taking shape!",
    nextStageHint: "Keep chatting to unlock style preferences..."
  },
  {
    id: 'style',
    category: 'styleTags',
    label: 'Style Curator', 
    threshold: 2,
    priority: 2,
    stage: 'noob',
    qualityGate: (config, conversation) => {
      return config.styleTags && 
             config.styleTags.length >= 2 &&
             config.styleTags.every(tag => tag.length > 2)
    },
    unlockMessage: "Your style signature is emerging!",
    nextStageHint: "Ready to level up? Let's talk boundaries..."
  },
  {
    id: 'boundaries',
    category: 'boundaries',
    label: 'Boundary Keeper',
    threshold: 1, 
    priority: 3,
    stage: 'pro',
    qualityGate: (config, conversation) => {
      return !!config.boundaries &&
             conversation.some(msg => /topic|boundary|avoid|limit/i.test(msg))
    },
    unlockMessage: "You've defined your limits - that's wisdom!",
    nextStageHint: "🚀 Pro level unlocked! Persona Preview is now available."
  },
  {
    id: 'communication',
    category: 'communicationPrefs',
    label: 'Communication Pro',
    threshold: 1,
    priority: 4, 
    stage: 'pro',
    qualityGate: (config, conversation) => {
      return !!config.communicationPrefs &&
             conversation.some(msg => /communicate|respond|reply|interact/i.test(msg))
    },
    unlockMessage: "Communication mastery achieved!",
    nextStageHint: "Getting close to Hero status..."
  },
  {
    id: 'audience',
    category: 'audienceDescription',
    label: 'Audience Expert',
    threshold: 1,
    priority: 5,
    stage: 'hero', 
    qualityGate: (config, conversation) => {
      return !!config.audienceDescription &&
             config.audienceDescription.length > 20 &&
             conversation.some(msg => /audience|follower|viewer|fan|customer/i.test(msg))
    },
    unlockMessage: "You know your people - that's 🔥!",
    nextStageHint: "One more badge to reach Legend status..."
  },
  {
    id: 'objective',
    category: 'avatarObjective', 
    label: 'Goal Setter',
    threshold: 1,
    priority: 6,
    stage: 'hero',
    qualityGate: (config, conversation) => {
      return !!config.avatarObjective &&
             conversation.some(msg => /goal|purpose|objective|mission/i.test(msg))
    },
    unlockMessage: "🎖️ Hero achieved! Your persona has true purpose.",
    nextStageHint: "🐐 Legend status awaits those who continue the journey..."
  }
]
```

## Chat Behavior Adaptation by Stage

### Stage-Aware Question Generation

```typescript
interface StageQuestionStrategy {
  stage: string
  questionTypes: ('direct' | 'scenario' | 'example' | 'reflective')[]
  promptTemplates: Record<string, string[]>
  transitionTriggers: string[]
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
  },
  {
    stage: 'hero',
    questionTypes: ['reflective', 'advanced'],
    promptTemplates: {
      audience: [
        "If you picture your ideal follower, who comes to mind?", 
        "Who are you speaking to when you respond?",
        "Describe the person who would love this persona most."
      ],
      objective: [
        "What should this persona accomplish in conversations?",
        "What's the deeper goal behind every interaction?",
        "How do you want people to feel after talking with your avatar?"
      ]
    },
    transitionTriggers: ['audience', 'goal', 'purpose', 'accomplish', 'follower']
  },
  {
    stage: 'legend',
    questionTypes: ['advanced', 'scenario'],
    promptTemplates: {
      edgeCases: [
        "How would you want this avatar to respond to harassment?",
        "What should your persona *never* say or do?",
        "How does your avatar handle trolling or inappropriate requests?"
      ],
      dynamicModes: [
        "Should your persona have different modes? (Hype mode, calm mode, etc.)",
        "How should your avatar adapt to different conversation contexts?",
        "What personality switches would be useful for your audience?"
      ]
    },
    transitionTriggers: ['mode', 'switch', 'context', 'harassment', 'never']
  }
]
```

## UI Enhancement Specifications

### Progressive Header Evolution

```typescript
interface StageHeaderConfig {
  stage: string
  gradient: string
  badgeStyle: string
  progressIndicator: 'badges' | 'percentage' | 'hybrid'
  stageIcon: string
  statusMessage: string
}

const STAGE_HEADER_CONFIGS: StageHeaderConfig[] = [
  {
    stage: 'npc',
    gradient: 'from-gray-50 to-gray-100',
    badgeStyle: 'grayscale',
    progressIndicator: 'badges',
    stageIcon: '⬛',
    statusMessage: 'Just getting started...'
  },
  {
    stage: 'noob',
    gradient: 'from-blue-50 to-indigo-50', 
    badgeStyle: 'muted',
    progressIndicator: 'badges',
    stageIcon: '🐣',
    statusMessage: 'Finding your voice...'
  },
  {
    stage: 'pro',
    gradient: 'from-green-50 to-emerald-50',
    badgeStyle: 'enhanced',
    progressIndicator: 'hybrid',
    stageIcon: '🚀',
    statusMessage: 'Persona Preview Unlocked!'
  },
  {
    stage: 'hero',
    gradient: 'from-purple-50 to-violet-50',
    badgeStyle: 'premium',
    progressIndicator: 'hybrid', 
    stageIcon: '🎖️',
    statusMessage: 'Hero status achieved!'
  },
  {
    stage: 'legend',
    gradient: 'from-yellow-50 to-orange-50',
    badgeStyle: 'legendary',
    progressIndicator: 'percentage',
    stageIcon: '🐐',
    statusMessage: 'Legend mode activated 🐐'
  }
]
```

### Stage Transition Animations

```typescript
interface StageTransitionEffect {
  from: string
  to: string
  animation: 'badge_burst' | 'level_up' | 'stage_unlock' | 'legend_reveal'
  duration: number
  celebrationCopy: string
  nextStagePreview?: string
}

const STAGE_TRANSITIONS: StageTransitionEffect[] = [
  {
    from: 'npc',
    to: 'noob', 
    animation: 'badge_burst',
    duration: 3000,
    celebrationCopy: "🐣 You've hatched! Welcome to personality building.",
    nextStagePreview: "Keep chatting to unlock Pro features..."
  },
  {
    from: 'noob',
    to: 'pro',
    animation: 'level_up',
    duration: 4000,
    celebrationCopy: "🚀 Pro level unlocked! Persona Preview is now available.",
    nextStagePreview: "Hero status within reach..."
  },
  {
    from: 'pro', 
    to: 'hero',
    animation: 'stage_unlock',
    duration: 5000,
    celebrationCopy: "🎖️ Hero achieved! Your persona is masterful.",
    nextStagePreview: "Legend status awaits the dedicated..."
  },
  {
    from: 'hero',
    to: 'legend',
    animation: 'legend_reveal',
    duration: 6000,
    celebrationCopy: "🐐 LEGEND STATUS UNLOCKED! You've built a digital icon.",
    nextStagePreview: "Master all advanced features to reach 100% completion."
  }
]
```

## Implementation Plan

### Phase 1: Core Integration
1. **Extend BadgeSystemState** to include current persona stage
2. **Update PersonaChatStateManager** with stage progression logic  
3. **Modify badge validation** to include quality gates
4. **Add stage-aware question generation** to chat prompts

### Phase 2: UI Enhancement
1. **Progressive header styling** based on current stage
2. **Stage transition animations** for level-up moments
3. **Enhanced badge celebrations** with stage context
4. **Stage status indicators** in chat interface

### Phase 3: Advanced Features  
1. **Dynamic prompt adaptation** based on stage and conversation history
2. **Quality-based progression** rather than just quantity
3. **Advanced parameter unlocking** for Legend tier users
4. **Retrospective analysis** of persona development journey

## Required File Changes

### 1. Enhanced State Management
**File**: `shared/persona-validation.ts`
```typescript
export interface EnhancedBadgeSystemState extends BadgeSystemState {
  currentStage: string
  stageProgress: number
  unlockedParameters: (keyof AvatarPersonaConfig)[]
  nextStageRequirement: number
  conversationQuality: number
}

export function calculatePersonaStage(badgeSystem: BadgeSystemState): string {
  const earnedCount = badgeSystem.totalEarned

  if (earnedCount >= 6) return 'legend'
  if (earnedCount >= 5) return 'hero' 
  if (earnedCount >= 3) return 'pro'
  if (earnedCount >= 1) return 'noob'
  return 'npc'
}

export function getStageQuestions(stage: string, unlockedParams: string[]): string[] {
  const strategy = STAGE_QUESTION_STRATEGIES.find(s => s.stage === stage)
  if (!strategy) return []

  return Object.values(strategy.promptTemplates).flat()
}
```

### 2. Progressive Chat Behavior
**File**: `client/src/components/PersonalityChat.tsx`
```typescript
// Add stage-aware question selection
const selectNextQuestion = useCallback((stage: string, conversation: string[]) => {
  const questions = getStageQuestions(stage, unlockedParameters)
  const contextualQuestions = questions.filter(q => 
    isRelevantToConversation(q, conversation)
  )
  return contextualQuestions[0] || questions[0]
}, [unlockedParameters])

// Add stage transition detection
const checkStageTransition = useCallback((newBadgeState: BadgeSystemState) => {
  const newStage = calculatePersonaStage(newBadgeState)
  if (newStage !== currentStage) {
    triggerStageTransition(currentStage, newStage)
    setCurrentStage(newStage)
  }
}, [currentStage])
```

### 3. Enhanced Badge Header
**File**: `client/src/components/ui/badge-header.tsx`
```typescript
interface EnhancedBadgeHeaderProps {
  badges: BadgeState[]
  currentStage: string
  stageProgress: number
  onStageTransition?: (stage: string) => void
}

export const EnhancedBadgeHeader: React.FC<EnhancedBadgeHeaderProps> = ({
  badges, 
  currentStage, 
  stageProgress,
  onStageTransition
}) => {
  const stageConfig = STAGE_HEADER_CONFIGS.find(c => c.stage === currentStage)
  const earnedBadges = badges.filter(badge => badge.earned)

  return (
    <div className={`bg-gradient-to-r ${stageConfig?.gradient} border-b p-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{stageConfig?.stageIcon}</span>
          <h3 className="text-sm font-semibold text-gray-700">
            {currentStage.toUpperCase()} Stage
          </h3>
        </div>
        <span className="text-xs text-gray-500">
          {earnedBadges.length}/6 Badges • {Math.round(stageProgress)}% Complete
        </span>
      </div>

      <p className="text-xs text-gray-600 mb-3">{stageConfig?.statusMessage}</p>

      {/* Badge collection with stage-aware styling */}
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <StageBadge 
            key={badge.id}
            badge={badge} 
            style={stageConfig?.badgeStyle}
          />
        ))}
      </div>
    </div>
  )
}
```

## Success Metrics

### User Engagement
- **Stage progression rate**: % of users reaching each stage
- **Session depth**: Average conversation length per stage
- **Quality improvement**: Badge earning vs. conversation quality correlation

### Technical Performance
- **Animation smoothness**: Stage transitions maintain 60fps
- **State consistency**: Badge and stage state remain synchronized
- **Progressive loading**: Advanced features unlock smoothly

### Business Impact
- **Completion rates**: More users reaching Hero/Legend status
- **Feature adoption**: Usage of unlocked advanced parameters
- **User satisfaction**: Higher NPS scores for progressive experience

## Backward Compatibility

### Existing Users
- **Automatic stage assignment** based on current badge progress
- **Retroactive celebrations** for stages already achieved
- **Graceful fallback** to basic badge system if stage data unavailable

### Legacy Badge System
- **Badge calculation remains unchanged** for existing logic
- **Progress percentages still available** as fallback indicator
- **Existing animations preserved** with stage enhancements layered on top

This integrated specification maintains the existing badge system's functionality while adding the progressive persona development journey that guides users from basic setup to advanced avatar configuration mastery.
