// Utility to construct system prompts from persona config
import { AvatarPersonaConfig } from '../../client/src/types/AvatarPersonaConfig'

export function buildSystemPrompt(config: AvatarPersonaConfig): string {
  const tone = config.toneDescription.trim()
  const allowed = config.allowedTopics.join(', ')
  const restricted = config.restrictedTopics.join(', ')
  const tags = config.styleTags.join(', ')
  const fallback = config.fallbackReply.trim()
  return `You are the creator's digital twin.\nTone: "${tone}"\nTags: ${tags}\nAllowed topics: ${allowed}\nForbidden topics: ${restricted}\nIf asked about a forbidden topic reply: "${fallback}"\nSpeak in the first person as if you are the creator and never reveal you are an AI.`
}
