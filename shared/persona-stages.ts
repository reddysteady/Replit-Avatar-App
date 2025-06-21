
export type PersonaStage = 'npc' | 'noob' | 'pro' | 'hero' | 'legend';

export interface StageConfig {
  id: PersonaStage;
  name: string;
  badgeRequirement: number;
  unlockedParameters: string[];
  chatPromptStyle: 'direct' | 'scenario' | 'reflective' | 'advanced';
  icon: string;
  celebrationCopy: string;
  gradient: string;
}

export const PERSONA_STAGES: Record<PersonaStage, StageConfig> = {
  npc: {
    id: 'npc',
    name: 'NPC',
    badgeRequirement: 0,
    unlockedParameters: ['initialContext'],
    chatPromptStyle: 'direct',
    icon: '⬛',
    celebrationCopy: "You're a blank slate... but greatness is loading.",
    gradient: 'from-gray-50 to-gray-100'
  },
  noob: {
    id: 'noob',
    name: 'Noob',
    badgeRequirement: 1,
    unlockedParameters: ['toneDescription', 'styleTags'],
    chatPromptStyle: 'direct',
    icon: '🐣',
    celebrationCopy: "You've cracked the shell — now we find your voice.",
    gradient: 'from-blue-50 to-indigo-50'
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    badgeRequirement: 3,
    unlockedParameters: ['boundaries', 'communicationPrefs'],
    chatPromptStyle: 'scenario',
    icon: '🚀',
    celebrationCopy: "Blast off. You've got a voice, and you're moving with purpose.",
    gradient: 'from-green-50 to-emerald-50'
  },
  hero: {
    id: 'hero',
    name: 'Hero',
    badgeRequirement: 5,
    unlockedParameters: ['audienceDescription', 'avatarObjective'],
    chatPromptStyle: 'reflective',
    icon: '🎖️',
    celebrationCopy: "You've earned your badge. This persona's got presence.",
    gradient: 'from-purple-50 to-violet-50'
  },
  legend: {
    id: 'legend',
    name: 'Legend',
    badgeRequirement: 6,
    unlockedParameters: ['edgeCases', 'dynamicModes', 'signaturePhrases'],
    chatPromptStyle: 'advanced',
    icon: '🐐',
    celebrationCopy: "Legend unlocked. You've built a digital icon. 🐐",
    gradient: 'from-yellow-50 to-orange-50'
  }
};

export function calculateStage(badgeCount: number): PersonaStage {
  if (badgeCount >= 6) return 'legend';
  if (badgeCount >= 5) return 'hero';
  if (badgeCount >= 3) return 'pro';
  if (badgeCount >= 1) return 'noob';
  return 'npc';
}
