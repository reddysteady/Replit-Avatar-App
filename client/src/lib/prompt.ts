// Added for persona config feature - see CHANGELOG.md entry
import { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'

/** Build a system prompt string from persona configuration. */
export function buildSystemPrompt(config: AvatarPersonaConfig): string {
  const tone = config.toneDescription.trim()
  const allowed = config.allowedTopics.join(', ')
  const restricted = config.restrictedTopics.join(', ')
  const tags = config.styleTags.join(', ')
  const fallback = config.fallbackReply.trim()
  return `You are the creator's digital twin.\nTone: "${tone}"\nTags: ${tags}\nAllowed topics: ${allowed}\nForbidden topics: ${restricted}\nIf asked about a forbidden topic reply: "${fallback}"\nSpeak in the first person as if you are the creator and never reveal you are an AI.`
}
