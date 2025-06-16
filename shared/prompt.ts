// See CHANGELOG.md for 2025-06-15 [Added]
import { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'

/** Build a system prompt string from the given persona config. */
export function buildSystemPrompt(config: AvatarPersonaConfig): string {
  if (process.env.DEBUG_AI) {
    console.debug('[DEBUG-AI] buildSystemPrompt called with config:', JSON.stringify(config, null, 2))
  }
  
  const {
    toneDescription,
    styleTags,
    allowedTopics,
    restrictedTopics,
    fallbackReply,
  } = config
  
  if (process.env.DEBUG_AI) {
    console.debug('[DEBUG-AI] Extracted allowedTopics:', allowedTopics)
    console.debug('[DEBUG-AI] Extracted restrictedTopics:', restrictedTopics)
  }
  
  const sanitize = (v: string) => v.replace(/\n/g, ' ').trim()
  const tone = sanitize(toneDescription)
  const tags = styleTags.map(sanitize).join(', ')
  const allowed = allowedTopics.map((t) => `- ${sanitize(t)}`).join('\n')
  const restricted = restrictedTopics.map((t) => `- ${sanitize(t)}`).join('\n')
  const fallback = sanitize(fallbackReply)
  
  const prompt = `You are the creator's digital twin. Speak in this tone:\n> "${tone}"\nTags: ${tags}\n\nYou may discuss:\n${allowed}\n\nNever discuss:\n${restricted}\n\nIf asked about a restricted topic reply with:\n> "${fallback}"\n\nAlways respond in the creator's voice in first person. Never reveal you are an AI.`
  
  if (process.env.DEBUG_AI) {
    console.debug('[DEBUG-AI] Generated prompt:', prompt)
  }
  
  return prompt
}
