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
  private systemPromptCache: Map<number, { prompt: string; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor() {}

  /**
   * Clears the system prompt cache for a specific user or all users
   */
  clearSystemPromptCache(userId?: number): void {
    if (userId) {
      this.systemPromptCache.delete(userId)
      if (process.env.DEBUG_AI) {
        console.debug(`[DEBUG-AI] Cleared system prompt cache for user ${userId}`)
      }
    } else {
      this.systemPromptCache.clear()
      if (process.env.DEBUG_AI) {
        console.debug('[DEBUG-AI] Cleared all system prompt cache')
      }
    }
  }

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
        console.error('[FALLBACK ROOT CAUSE] No OpenAI API key found in environment or settings')
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
        console.error(`[FALLBACK ROOT CAUSE] Invalid OpenAI API key format from ${keySource}. Key starts with: ${currentKey.substring(0, 7)}...`)
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

      // Check cache first
      const userId = 1 // For MVP, assume user ID 1
      const now = Date.now()
      const cached = this.systemPromptCache.get(userId)

      let systemPrompt: string
      if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
        systemPrompt = cached.prompt
        if (process.env.DEBUG_AI) {
          console.debug('[DEBUG-AI] Using cached system prompt')
        }
      } else {
        // Force fresh reload by not using settings.systemPrompt
        const persona = personaConfig ?? settings.personaConfig
        if (persona && persona.toneDescription && (persona.allowedTopics?.length > 0 || persona.restrictedTopics?.length > 0)) {
          if (process.env.DEBUG_AI) {
            console.debug(
              '[DEBUG-AI] Persona config:',
              JSON.stringify(persona, null, 2),
            )
          }
          systemPrompt = buildSystemPrompt(persona as AvatarPersonaConfig)
        } else {
          if (process.env.DEBUG_AI) {
            console.debug('[DEBUG-AI] No valid persona config found, using default prompt')
          }
          systemPrompt = DEFAULT_SYSTEM_PROMPT
        }

        // Cache the generated prompt
        this.systemPromptCache.set(userId, { prompt: systemPrompt, timestamp: now })

        if (process.env.DEBUG_AI) {
          console.debug('[DEBUG-AI] Generated fresh system prompt:', systemPrompt)
        }
      }

      if (contextSection) {
        systemPrompt += `\n\n${contextSection}`
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

      // Handle different types of API errors with detailed logging
      if (
        error.status === 401 ||
        error.message.includes('401') ||
        error.message.includes('Unauthorized')
      ) {
        console.error(`[FALLBACK ROOT CAUSE] Invalid OpenAI API key from ${keySource}. Error:`, error.message)
        log(`Invalid OpenAI API key from ${keySource}. Using fallback reply.`)
        return this.generateFallbackReply(params.content, params.senderName)
      }

      if (
        error.status === 429 ||
        error.message.includes('429') ||
        error.message.includes('quota exceeded')
      ) {
        console.error('[FALLBACK ROOT CAUSE] OpenAI quota/rate limit exceeded. Error:', error.message)
        log('OpenAI quota exceeded. Using fallback reply.')
        return this.generateFallbackReply(params.content, params.senderName)
      }

      if (
        error.status === 403 ||
        error.message.includes('403') ||
        error.message.includes('insufficient_quota')
      ) {
        console.error('[FALLBACK ROOT CAUSE] OpenAI insufficient quota/permissions. Error:', error.message)
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
    const { client, hasKey } = await this.getClient()
    if (!hasKey) {
      return { isSensitive: false, confidence: 0, category: 'none' }
    }

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze the following text for sensitive content. Return a JSON object with:
              - isSensitive: boolean
              - confidence: number between 0-1
              - category: string (e.g., "political", "personal", "legal", "medical", "none")`,
          },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
      })

      return JSON.parse(response.choices[0]?.message?.content || '{}')
    } catch (error) {
      log('Error detecting sensitive content:', error)
      return { isSensitive: false, confidence: 0, category: 'error' }
    }
  }

  async extractPersonalityFromConversation(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    currentConfig: any = {},
    enablePersonaPreview: boolean = false,
    transitionThreshold: number = 4,
    initialMessage: boolean = false
  ): Promise<{ response: string; extractedData: any; isComplete: boolean; personaMode?: string; confidenceScore?: number; transitionMessage?: string; isFinished?: boolean }> {
    const { client, hasKey } = await this.getClient()
    if (!hasKey) {
      return {
        response: "I'm having trouble processing right now. Could you try again?",
        extractedData: {},
        isComplete: false
      }
    }

    // Count how many fields we already have
    const fieldsCollected = Object.keys(currentConfig).filter(key => 
      currentConfig[key] && 
      (typeof currentConfig[key] === 'string' && currentConfig[key].length > 0) ||
      (Array.isArray(currentConfig[key]) && currentConfig[key].length > 0)
    ).length

    const totalFieldsNeeded = 7
    // Handle initial message generation
    if (initialMessage && messages.length === 1 && messages[0].role === 'system') {
      const initialSystemPrompt = `Generate an engaging, specific opening question to begin persona discovery for a creator's AI avatar. 

Make the question:
- Warm and conversational
- Specific rather than generic (avoid "what's your vibe")
- Designed to immediately capture personality traits
- Action-oriented or scenario-based
- Under 50 words

Examples of good opening questions:
- "Picture your most loyal follower - when they need advice, how do you typically respond to them?"
- "If someone watched you create content for a week, what three words would they use to describe your style?"
- "What's the one thing you always want your audience to feel after interacting with you?"

Generate ONE opening question in this style:`

      try {
        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: initialSystemPrompt }
          ],
          temperature: 0.7,
          max_tokens: 100,
        })

        const initialQuestion = response.choices[0]?.message?.content || "Hey there! Picture your most engaged follower - when they ask you for advice, how do you naturally respond to them?"

        return {
          response: initialQuestion,
          extractedData: {},
          isComplete: false,
          personaMode: 'guidance',
          confidenceScore: 0
        }
      } catch (error) {
        console.error('Error generating initial message:', error)
        return {
          response: "Hey there! Let's start with something specific - if your biggest supporter asked you to describe your communication style in three words, what would they be?",
          extractedData: {},
          isComplete: false,
          personaMode: 'guidance',
          confidenceScore: 0
        }
      }
    }

    const isNearComplete = fieldsCollected >= 4
    const isComplete = fieldsCollected >= 4
    const shouldUsePersonaMode = isComplete && fieldsCollected >= 4

    // Determine persona mode
    let personaMode: 'guidance' | 'blended' | 'persona_preview' = 'guidance'
    if (shouldUsePersonaMode && currentConfig.toneDescription) {
      personaMode = fieldsCollected >= 5 ? 'persona_preview' : 'blended'
    }

    let systemPrompt = ''

    if (personaMode === 'guidance') {
      systemPrompt = `You are an AI assistant helping a content creator configure their AI avatar's personality. Your goal is to extract specific configuration data through natural conversation.

CRITICAL: Always respond with valid JSON in this exact format:
{
  "response": "your conversational response text here",
  "extractedData": {
    "toneDescription": "extracted tone if found",
    "styleTags": ["array", "of", "style", "tags"],
    "allowedTopics": ["topics", "they", "want", "to", "discuss"],
    "restrictedTopics": ["topics", "to", "avoid"],
    "fallbackReply": "what to say for restricted topics",
    "avatarObjective": ["their", "main", "goals"],
    "audienceDescription": "description of their audience"
  },
  "isComplete": false,
  "isFinished": false
}

Only include fields in extractedData if you have confident information. Use empty arrays [] for array fields if no data found.

Current conversation context:
- Message count: ${messages.length}
- Configuration fields collected: ${fieldsCollected}
- Completion status: ${isNearComplete ? 'Near complete' : 'In progress'}

${messages.length <= 2 ? `
OPENING APPROACH: Start with an engaging, specific question that gets them talking about their communication style naturally. Make it personal and relatable.
` : ''}

${messages.length > 2 && messages.length <= 5 ? `
FOLLOW-UP STRATEGY: Build on what they've shared. Ask follow-up questions that dig deeper into their communication patterns, audience, and goals.
` : ''}

${messages.length > 5 && messages.length <= 15 ? `
DEEPER EXPLORATION: You have good foundational data. Now explore nuances - their tone variations, specific topics they love/avoid, communication objectives, and audience interaction style. Ask about:
- How they handle different types of questions (technical vs personal)
- Their approach to controversial or sensitive topics
- What makes their communication unique vs others in their field
- How they want to be perceived by their audience
` : ''}

${messages.length > 15 && messages.length <= 25 ? `
ADVANCED REFINEMENT: Focus on subtleties and edge cases. Ask about:
- Their communication style in different moods or contexts
- How they adapt their message for different audience segments
- Their boundaries and comfort zones
- What they never want their avatar to say or do
` : ''}

${messages.length > 25 ? `
CONVERSATION COMPLETION: You should have comprehensive data by now. If you have solid information for most configuration fields, gracefully conclude that you have enough information to create a robust persona. Say something like "That's wonderful! I think I've gathered enough information to create your persona. Click the Complete Setup button to review your configuration."
` : ''}

CONFIGURATION TARGETS to extract:
1. toneDescription: Their overall communication style and voice
2. styleTags: Communication characteristics (Casual, Professional, Humorous, etc.)
3. allowedTopics: Topics they want to discuss
4. restrictedTopics: Topics they want to avoid
5. fallbackReply: What to say when asked about restricted topics
6. avatarObjective: Their main goals (Educate, Entertain, Build Community, etc.)
7. audienceDescription: Who they're trying to reach

RESPONSE BEHAVIOR:
- When isComplete is true but isFinished is false: Say something like "Perfect! I've captured your personality. Keep chatting to help me fine-tune your persona or click Complete Setup to move to the next step." Continue asking detailed follow-up questions.
- When isFinished is true: Say something like "That's wonderful! I think I've gathered enough information to create your persona. Click the Complete Setup button to review your configuration." Stop asking questions.
- Set isComplete to true when you have captured basic personality information (tone, style, some topics, objectives) - usually around 4-6 exchanges
- Set isFinished to true only after 15+ exchanges or when you have comprehensive data for all fields
- Ask ONE clear, specific question per response (unless finishing)
- Build on their previous answers naturally and ask deeper follow-ups
- Use their own words and examples when possible
- Keep responses conversational and encouraging
- Extract data incrementally without being obvious about it
- Focus on gathering nuanced details that make their persona unique

CURRENT CONFIGURATION STATE:
${Object.keys(currentConfig).length > 0 ? JSON.stringify(currentConfig, null, 2) : 'No configuration data collected yet'}`
    } else {
      // Persona preview mode - blend captured personality with guidance
      const toneDesc = currentConfig.toneDescription || 'friendly and conversational'
      const styleInfo = currentConfig.styleTags?.length > 0 ? ` Style: ${currentConfig.styleTags.join(', ')}.` : ''
      const topicInfo = currentConfig.allowedTopics?.length > 0 ? ` Topics I love: ${currentConfig.allowedTopics.slice(0, 3).join(', ')}.` : ''
      const audienceInfo = currentConfig.audienceDescription ? ` My audience: ${currentConfig.audienceDescription}.` : ''

      systemPrompt = `You are demonstrating the creator's captured personality while continuing to gather configuration data. 

PERSONA TO ADOPT:
- Tone: ${toneDesc}${styleInfo}${topicInfo}${audienceInfo}
- Speak AS the creator, using their voice and personality
- ${personaMode === 'persona_preview' ? 'Fully embody their personality while asking questions' : 'Blend their emerging personality with guidance questions'}

DUAL PURPOSE:
1. DEMONSTRATE their captured personality by speaking in their voice
2. CONTINUE gathering missing configuration data: ${7 - fieldsCollected} fields remaining

GUIDANCE OBJECTIVES (ask about these while in persona):
${!currentConfig.toneDescription ? '- More details about their communication tone and style\n' : ''}
${!currentConfig.styleTags?.length ? '- Specific style characteristics (casual, professional, humorous, etc.)\n' : ''}
${!currentConfig.allowedTopics?.length ? '- Topics they want to discuss with their audience\n' : ''}
${!currentConfig.restrictedTopics?.length ? '- Topics they want to avoid or handle carefully\n' : ''}
${!currentConfig.fallbackReply ? '- How they prefer to handle sensitive topics\n' : ''}
${!currentConfig.avatarObjective?.length ? '- Their main goals and objectives\n' : ''}
${!currentConfig.audienceDescription ? '- More details about their target audience\n' : ''}

CRITICAL: Always respond with valid JSON in this exact format:
{
  "response": "your response in the creator's voice",
  "extractedData": {
    "toneDescription": "more details about tone if found",
    "styleTags": ["additional", "style", "characteristics"],
    "allowedTopics": ["more", "topics", "discovered"],
    "restrictedTopics": ["topics", "to", "avoid"],
    "fallbackReply": "preferred way to handle sensitive topics",
    "avatarObjective": ["clarified", "goals"],
    "audienceDescription": "refined audience description"
  },
  "isComplete": false,
  "isFinished": false
}

Only include fields in extractedData if you discovered NEW or REFINED information. Use empty arrays [] for array fields if no new data.

BEHAVIOR RULES:
- Speak in first person as the creator ("I", "my audience", "when I...")
- Use their captured tone and style in your response
- Ask follow-up questions IN THEIR VOICE
- Show enthusiasm about the persona development using their style
- Keep the dual purpose: demonstrate personality + gather data
- ${personaMode === 'persona_preview' ? 'Add confidence and personality to questions' : 'Gradually transition to their voice'}

CURRENT CONFIGURATION STATE:
${JSON.stringify(currentConfig, null, 2)}`
    }

    try {
      if (process.env.DEBUG_AI) {
        console.debug('[DEBUG-AI] Personality extraction request:', {
          messageCount: messages.length,
          currentConfigKeys: Object.keys(currentConfig),
          fieldsCollected
        })
      }

      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        response_format: { type: 'json_object' }, // Force JSON response
        temperature: 0.3, // Lower temperature for more consistent JSON
      })

      const content = response.choices[0]?.message?.content || '{}'

      if (process.env.DEBUG_AI) {
        console.debug('[DEBUG-AI] OpenAI raw response:', content)
      }
      
      // Always log personality extraction responses for debugging
      console.log('[PERSONALITY-DEBUG] Raw OpenAI response:', content.substring(0, 200) + (content.length > 200 ? '...' : ''))

      // Additional validation to ensure we have valid JSON
      let result
      try {
        result = JSON.parse(content)
      } catch (parseError) {
        console.error('JSON parse error, content was:', content)
        log('Personality extraction JSON parse failed')
        // Extract any meaningful content and create a valid response
        return {
          response: "Let me ask this more directly - are you looking to be more casual and friendly, or professional and informative with your audience?",
          extractedData: {},
          isComplete: false,
          personaMode: 'guidance',
          confidenceScore: 0
        }
      }

      // Handle different response formats from OpenAI
      let extractedData = {}
      let responseText = ""
      
      // Check if result has the expected structure (response + extractedData)
      if (result.response && result.extractedData) {
        responseText = result.response
        extractedData = result.extractedData
      } 
      // If result only contains configuration data (direct extraction)
      else if (result.toneDescription !== undefined || result.styleTags !== undefined || 
               result.allowedTopics !== undefined || result.restrictedTopics !== undefined ||
               result.fallbackReply !== undefined || result.avatarObjective !== undefined ||
               result.audienceDescription !== undefined) {
        // This is extracted configuration data, we need to generate a response
        extractedData = result
        
        // Generate appropriate response based on what we extracted and persona mode
        if (personaMode === 'guidance') {
          if (fieldsCollected < 2) {
            responseText = "That's great insight! Tell me more about your typical communication style - are you more casual and conversational, or professional and informative?"
          } else if (fieldsCollected < 4) {
            responseText = "Perfect! I'm getting a good sense of your style. What topics do you love discussing with your audience most?"
          } else {
            responseText = "Excellent! I'm capturing your personality well. What topics should I avoid or handle carefully when representing you?"
          }
        } else {
          // In persona preview mode, generate response in their voice
          const tone = extractedData.toneDescription || currentConfig.toneDescription || 'friendly'
          if (fieldsCollected >= 4) {
            responseText = "I'm really starting to get your vibe! What else should I know about how you like to connect with your audience?"
          } else {
            responseText = "This is coming together nicely! Tell me more about the topics you're passionate about sharing."
          }
        }
      }
      // Fallback if we can't parse the structure
      else {
        console.warn('[PERSONALITY-DEBUG] Unexpected response structure:', result)
        responseText = "Great! Tell me more about what you'd like your avatar to focus on."
        extractedData = {}
      }

      // Clean up and merge extracted data
      const cleanExtractedData = {}
      Object.keys(extractedData).forEach(key => {
        if (extractedData[key] !== null && extractedData[key] !== undefined && extractedData[key] !== '') {
          cleanExtractedData[key] = extractedData[key]
        }
      })

      const finalResult = {
        response: responseText,
        extractedData: cleanExtractedData,
        personaMode: personaMode,
        isComplete: isComplete,
        isFinished: result.isFinished || messages.length > 25,
        confidenceScore: (fieldsCollected + Object.keys(cleanExtractedData).length) / 7,
        transitionMessage: personaMode !== 'guidance' && fieldsCollected === 4 ? 'Now speaking in your captured personality! 🎭' : undefined
      }
      
      console.log('[PERSONALITY-DEBUG] Final result:', {
        responseLength: finalResult.response.length,
        extractedDataKeys: Object.keys(finalResult.extractedData),
        extractedDataValues: finalResult.extractedData,
        personaMode: finalResult.personaMode,
        isComplete: finalResult.isComplete,
        isFinished: finalResult.isFinished,
        fieldsCollectedBefore: fieldsCollected,
        newFieldsFound: Object.keys(cleanExtractedData).length
      })
      
      return finalResult
    } catch (error: any) {
      console.error('Error extracting personality:', error)
      log('Personality extraction failed:', error.message)

      // Handle specific error types
      if (error.status === 401 || error.message?.includes('401')) {
        return {
          response: "I'm having trouble with my AI connection. Let's try a simple question - what's your main goal: building community, educating people, or entertaining your audience?",
          extractedData: {},
          isComplete: false,
          personaMode: 'guidance',
          confidenceScore: 0
        }
      }

      if (error.status === 429 || error.message?.includes('429')) {
        return {
          response: "I need to slow down a bit. While I reset, tell me - how would you describe your communication style in one word?",
          extractedData: {},
          isComplete: false,
          personaMode: 'guidance',
          confidenceScore: 0
        }
      }

      return {
        response: "Let me try a different approach - what's the most important thing you want your avatar to accomplish with your audience?",
        extractedData: {},
        isComplete: false,
        personaMode: 'guidance',
        confidenceScore: 0
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