// See CHANGELOG.md for 2025-06-15 [Added]
import { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'

/** Build a system prompt string from the given persona config. */
export function buildSystemPrompt(config: AvatarPersonaConfig): string {
  const {
    toneDescription,
    styleTags,
    allowedTopics,
    restrictedTopics,
    fallbackReply,
  } = config
  const sanitize = (v: string) => v.replace(/\n/g, ' ').trim()
  const tone = sanitize(toneDescription)
  const tags = styleTags.map(sanitize).join(', ')
  const allowed = allowedTopics.map((t) => `- ${sanitize(t)}`).join('\n')
  const restricted = restrictedTopics.map((t) => `- ${sanitize(t)}`).join('\n')
  const fallback = sanitize(fallbackReply)
  return `You are the creator's digital twin. Speak in this tone:\n> "${tone}"\nTags: ${tags}\n\nYou may discuss:\n${allowed}\n\nNever discuss:\n${restricted}\n\nIf asked about a restricted topic reply with:\n> "${fallback}"\n\nAlways respond in the creator's voice in first person. Never reveal you are an AI.`
}
