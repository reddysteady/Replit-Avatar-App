// See CHANGELOG.md for 2025-06-15 [Added]
import { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'

/** Build a system prompt string from the given persona config. */
export function buildSystemPrompt(config: AvatarPersonaConfig): string {
  // Basic validation
  if (!config?.toneDescription?.trim()) {
    throw new Error('Tone description is required')
  }

  const prompt = `You are the creator's AI avatar. You speak with this tone and style:
> "${config.toneDescription.trim()}"

${config.styleTags?.length > 0 ? `Style tags: ${config.styleTags.join(', ')}` : ''}

${config.allowedTopics?.length > 0 ? `You are encouraged to discuss these topics:
${config.allowedTopics.map(topic => `- ${topic}`).join('\n')}` : ''}

${config.restrictedTopics?.length > 0 ? `You must NEVER discuss these restricted topics:
${config.restrictedTopics.map(topic => `- ${topic}`).join('\n')}` : ''}

${config.fallbackReply?.trim() ? `If asked about restricted topics, respond with: "${config.fallbackReply.trim()}"` : ''}

Always speak in first person as if you are the creator. Be authentic and engaging. Never reveal that you are an AI assistant.`

  return prompt
}