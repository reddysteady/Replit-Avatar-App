/**
 * OpenAI API service
 * Handles interactions with OpenAI for message generation, intent classification,
 * and content moderation
 */
// See CHANGELOG.md for 2025-06-11 [Fixed-2]
// See CHANGELOG.md for 2025-06-11 [Changed]
// See CHANGELOG.md for 2025-06-11 [Fixed]
// See CHANGELOG.md for 2025-06-11 [Fixed-3]
// See CHANGELOG.md for 2025-06-12 [Changed]
// See CHANGELOG.md for 2025-06-11 [Changed-4]
// See CHANGELOG.md for 2025-06-16 [Changed]
// See CHANGELOG.md for 2025-06-16 [Changed-2]

// dotenv/config is imported in server/index.ts before this service is
// instantiated, so manual .env parsing is unnecessary.

import OpenAI from 'openai'
import { storage } from '../storage'
import { log } from '../logger'
import { buildSystemPrompt } from '@shared/prompt'
import type { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = 'gpt-4o'

/** Default fallback system prompt when no persona is configured. */
const DEFAULT_SYSTEM_PROMPT =
  "You are the creator's helpful digital twin. Respond in first person and never mention you are AI."

interface GenerateReplyParams {
  content: string
  senderName: string
  temperature: number
  maxLength: number
  model?: string
  contextSnippets?: string[] // Additional context from content RAG pipeline
  flexProcessing?: boolean
  personaConfig?: AvatarPersonaConfig | null
}

interface ClassifyIntentResult {
  isHighIntent: boolean
  confidence: number
  category: string
}

interface DetectSensitiveResult {
  isSensitive: boolean
  confidence: number
  category: string
}

export class AIService {
  constructor() {}

  /**
   * Retrieve an OpenAI client using either the environment variable or the
   * stored token. Logs the source when DEBUG_AI is enabled.
   */
  private async getClient(): Promise<{
    client: OpenAI
    hasKey: boolean
    keySource: string
  }> {
    const settings = await storage.getSettings(1) // For MVP, assume user ID 1
    let apiKey = settings.openaiToken || undefined
    let source = 'storage'

    if (!apiKey) {
      apiKey = process.env.OPENAI_API_KEY
      source = 'env'
    }

    if (!apiKey) {
      log('OpenAI API key not found in env or storage.')
    } else if (process.env.DEBUG_AI) {
      console.debug(`[DEBUG-AI] Using ${source} API key`)
    }

    const key = apiKey || undefined
    return {
      client: new OpenAI({ apiKey: key }),
      hasKey: Boolean(apiKey),
      keySource: source,
    }
  }

  /**
   * Validates if an API key is properly formatted (basic check)
   */
  private isValidKeyFormat(apiKey: string): boolean {
    // OpenAI keys start with 'sk-' and are typically 51 characters
    return apiKey.startsWith('sk-') && apiKey.length >= 20
  }

  /**
   * Generates embeddings for content or queries
   * Used for the RAG pipeline to enable semantic search
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const { client } = await this.getClient()
      const response = await client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      // Return a dummy embedding in case of failure
      // In production, you might want to handle this differently
      return Array(1536).fill(0)
    }
  }

  /**
   * Generates an AI reply to a message based on creator's tone and style
   * with contextual awareness using RAG pipeline
   */
  async generateReply(params: GenerateReplyParams): Promise<string> {
    let keySource = 'env'
    try {
      const {
        content,
        senderName,
        temperature,
        maxLength,
        contextSnippets,
        flexProcessing,
        model,
        personaConfig,
      } = params

      if (process.env.DEBUG_AI) {
        console.debug('[DEBUG-AI] generateReply called', { senderName, model })
      }

      const { client, hasKey, keySource: src } = await this.getClient()
      keySource = src
      if (!hasKey) {
        if (process.env.DEBUG_AI) {
          console.debug('[DEBUG-AI] Missing OPENAI_API_KEY, using fallback')
        }
        log('OpenAI API key not found. Using fallback reply.')
        return this.generateFallbackReply(content, senderName)
      }

      // Basic key format validation
      const settings = await storage.getSettings(1)
      const currentKey =
        keySource === 'env' ? process.env.OPENAI_API_KEY : settings.openaiToken
      if (currentKey && !this.isValidKeyFormat(currentKey)) {
        if (process.env.DEBUG_AI) {
          console.debug(`[DEBUG-AI] Invalid API key format from ${keySource}`)
        }
        log(
          `Invalid OpenAI API key format from ${keySource}. Using fallback reply.`,
        )
        return this.generateFallbackReply(content, senderName)
      }

      // Build context from RAG pipeline if available
      let contextSection = ''
      if (contextSnippets && contextSnippets.length > 0) {
        contextSection = `
        IMPORTANT CONTEXT: The following are direct quotes from the creator's content that show their expertise, opinions, and communication style. Use this to ensure your response authentically represents them:
        
        ${contextSnippets.map((snippet, index) => `[${index + 1}] "${snippet}"`).join('\n\n')}
        
        Use the above content to inform your response when relevant. Don't explicitly reference these quotes or mention that you're using them as context. Instead, seamlessly incorporate the creator's expertise, preferences, and tone into your response as if you are truly their digital twin.
        `
      }

      let systemPrompt = settings.systemPrompt
      if (!systemPrompt) {
        const persona = personaConfig ?? settings.personaConfig
        if (persona) {
          if (process.env.DEBUG_AI) {
            console.debug(
              '[DEBUG-AI] Persona config:',
              JSON.stringify(persona, null, 2),
            )
          }
          systemPrompt = buildSystemPrompt(persona as AvatarPersonaConfig)
        } else {
          systemPrompt = DEFAULT_SYSTEM_PROMPT
        }

        if (process.env.DEBUG_AI) {
          console.debug('[DEBUG-AI] Generated system prompt:', systemPrompt)
        }

        if (contextSection) {
          systemPrompt += `\n\n${contextSection}`
        }
      }
      
      /* ────────────────────────────────────────────────────────── */
      /* 🔍 DEBUG: dump the exact payload that will be sent to OpenAI */
      if (process.env.DEBUG_AI) {
        console.debug('[DEBUG-AI] Final prompt payload', {
          model: model || DEFAULT_MODEL,
          senderName,
          systemPrompt,
          contextSnippets,      // raw array for quick inspection
        })
      }
      
      /* ────────────────────────────────────────────────────────── */
      // now continue with userPrompt / messages / client.chat …
      
      const userPrompt = `
        Here is a message from a follower named ${senderName}:
        "${content}"
        
        Write a response that matches the creator's tone and communication style.
        ${contextSnippets && contextSnippets.length > 0 ? "Use the contextual information when it's relevant to the question." : ''}
      `

      const response = await client.chat.completions.create({
        model: model || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: temperature,
        max_tokens: maxLength,
        service_tier: flexProcessing ? 'flex' : undefined,
      })

      if (process.env.DEBUG_AI) {
        console.debug('[DEBUG-AI] OpenAI response', response)
      }

      return (
        response.choices[0].message.content || 'Thank you for your message!'
      )
    } catch (error: any) {
      console.error('Error generating AI reply:', error.message)

      // Handle different types of API errors
      if (
        error.status === 401 ||
        error.message.includes('401') ||
        error.message.includes('Unauthorized')
      ) {
        log(`Invalid OpenAI API key from ${keySource}. Using fallback reply.`)
        return this.generateFallbackReply(params.content, params.senderName)
      }

      if (
        error.status === 429 ||
        error.message.includes('429') ||
        error.message.includes('quota exceeded')
      ) {
        log('OpenAI quota exceeded. Using fallback reply.')
        return this.generateFallbackReply(params.content, params.senderName)
      }

      if (
        error.status === 403 ||
        error.message.includes('403') ||
        error.message.includes('insufficient_quota')
      ) {
        log('OpenAI insufficient quota/permissions. Using fallback reply.')
        return this.generateFallbackReply(params.content, params.senderName)
      }

      throw new Error(`Failed to generate AI reply: ${error.message}`)
    }
  }

  /**
   * Generates a fallback reply when OpenAI API is unavailable
   */
  private generateFallbackReply(content: string, senderName: string): string {
    // Analyze the message content for some basic context
    const contentLower = content.toLowerCase()
    let replyTemplate = ''

    // Simple message categorization based on keywords
    if (
      contentLower.includes('question') ||
      contentLower.includes('help') ||
      contentLower.includes('how do') ||
      contentLower.includes('what is') ||
      contentLower.includes('?')
    ) {
      replyTemplate = `Hey ${senderName}, thanks for your question! I'll get back to you with a more detailed response soon. In the meantime, feel free to check out my recent content which might address similar topics.`
    } else if (
      contentLower.includes('love') ||
      contentLower.includes('awesome') ||
      contentLower.includes('great') ||
      contentLower.includes('amazing') ||
      contentLower.includes('good')
    ) {
      replyTemplate = `Thanks so much for your kind words, ${senderName}! I really appreciate your support and I'm glad you're enjoying my content. Stay tuned for more coming soon!`
    } else if (
      contentLower.includes('collab') ||
      contentLower.includes('business') ||
      contentLower.includes('work together') ||
      contentLower.includes('partner') ||
      contentLower.includes('opportunity')
    ) {
      replyTemplate = `Hi ${senderName}, thanks for reaching out about collaboration! I'm always interested in exploring new opportunities. Let me review the details and I'll get back to you soon with more thoughts on how we might work together.`
    } else {
      replyTemplate = `Hey ${senderName}, thanks for your message! I appreciate you reaching out. I'll get back to you soon with a more personalized response.`
    }

    return replyTemplate
  }

  /**
   * Classifies the intent of a message to identify high-intent leads
   */
  async classifyIntent(text: string): Promise<ClassifyIntentResult> {
    try {
      const prompt = `
        Analyze the following message and determine if it represents a high-intent lead. 
        A high-intent lead is someone who is likely to convert into a customer, client, or collaborator.
        High-intent indicators include: seeking services, mentioning budget, asking about pricing, 
        discussing collaboration, mentioning business needs, or requesting detailed information about products/services.

        Message: "${text}"

        Respond with JSON in this format:
        {
          "isHighIntent": boolean,
          "confidence": number between 0 and 1,
          "category": one of ["general_inquiry", "service_inquiry", "collaboration", "business_opportunity", "feedback", "other"]
        }
      `

      const { client } = await this.getClient()
      const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')

      return {
        isHighIntent: result.isHighIntent || false,
        confidence: Math.max(0, Math.min(1, result.confidence || 0)),
        category: result.category || 'general_inquiry',
      }
    } catch (error: any) {
      console.error('Error classifying message intent:', error.message)
      // Return default values in case of error
      return {
        isHighIntent: false,
        confidence: 0,
        category: 'general_inquiry',
      }
    }
  }

  /**
   * Detects sensitive content in messages that might require human review
   */
  async detectSensitiveContent(text: string): Promise<DetectSensitiveResult> {
    try {
      const prompt = `
        Analyze the following message and determine if it contains sensitive content 
        that should be reviewed by a human rather than receiving an automated response.
        Sensitive content includes: legal issues, complaints, refund requests, account issues, 
        sensitive personal information, potentially harmful topics, or any content that might 
        require special handling.

        Message: "${text}"

        Respond with JSON in this format:
        {
          "isSensitive": boolean,
          "confidence": number between 0 and 1,
          "category": one of ["not_sensitive", "legal", "complaint", "refund", "account_issue", "personal_info", "harmful", "other"]
        }
      `

      const { client } = await this.getClient()
      const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')

      return {
        isSensitive: result.isSensitive || false,
        confidence: Math.max(0, Math.min(1, result.confidence || 0)),
        category: result.category || 'not_sensitive',
      }
    } catch (error: any) {
      console.error('Error detecting sensitive content:', error.message)
      // Return default values in case of error
      return {
        isSensitive: false,
        confidence: 0,
        category: 'not_sensitive',
      }
    }
  }

  /**
   * Analyzes a message to check if any automation rules should apply
   */
  async matchAutomationRules(text: string, rules: any[]) {
    try {
      // For simple keyword matching, we don't need AI, but for more complex rule matching
      // we could use AI to determine if a message matches a rule's intent

      // This is a simple implementation that could be expanded
      const matchedRules = rules.filter((rule) => {
        if (!rule.enabled) return false

        // Simple keyword matching
        if (
          rule.triggerType === 'keywords' &&
          rule.triggerKeywords &&
          rule.triggerKeywords.length > 0
        ) {
          const lowerText = text.toLowerCase()
          return rule.triggerKeywords.some((keyword: string) =>
            lowerText.includes(keyword.toLowerCase()),
          )
        }

        return false
      })

      return matchedRules
    } catch (error: any) {
      console.error('Error matching automation rules:', error.message)
      return []
    }
  }
}

export const aiService = new AIService()
