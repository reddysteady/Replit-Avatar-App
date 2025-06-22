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

// Shared validation logic
const CORE_PERSONA_FIELDS = [
  'avatarObjective',
  'audienceDescription',
  'toneDescription',
  'styleTags',
  'boundaries',
  'communicationPrefs',
] as const;

function countValidFields(config: Partial<AvatarPersonaConfig>): number {
  return CORE_PERSONA_FIELDS.filter(key => {
    const value = config[key];
    if (!value) return false;

    if (typeof value === 'string') return value.length > 3;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;

    return false;
  }).length;
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
  messages: any[],
  currentConfig: Partial<AvatarPersonaConfig> = {},
  initialMessage = false,
  confirmedTraits?: string[]
): Promise<{
  response: string
  extractedData: Partial<AvatarPersonaConfig>
  isComplete: boolean
  personaMode: 'guidance' | 'blended' | 'persona_preview'
  confidenceScore: number
  transitionMessage?: string
  isFinished?: boolean
  showChipSelector?: boolean
  suggestedTraits?: Array<{id: string, label: string, selected: boolean}>
  reflectionCheckpoint?: boolean
  sessionState?: any
}> {
    if (process.env.DEBUG_AI) {
      console.debug('[PERSONALITY-EXTRACT] Starting extraction with:', {
        messageCount: messages?.length || 0,
        initialMessage,
        hasCurrentConfig: !!currentConfig,
        confirmedTraits: confirmedTraits?.length || 0
      })
    }

    try {
      const { client, hasKey, keySource } = await this.getClient()

      if (process.env.DEBUG_AI) {
        console.debug('[PERSONALITY-EXTRACT] API key check:', { hasKey, keySource })
      }

      if (!hasKey) {
        console.error('[PERSONALITY-ERROR] No OpenAI API key available')
        console.error('[PERSONALITY-ERROR] Key check details:', {
          envKey: !!process.env.OPENAI_API_KEY,
          envKeyLength: process.env.OPENAI_API_KEY?.length || 0,
          storageKey: !!settings.openaiToken,
          storageKeyLength: settings.openaiToken?.length || 0
        })
        return this.createFallbackResponse(
          "I need an OpenAI API key to help with personality setup. Please add your API key in Settings.",
          'guidance'
        )
      }

      // Validate API key format
      const settings = await storage.getSettings(1)
      const currentKey = keySource === 'env' ? process.env.OPENAI_API_KEY : settings.openaiToken

      if (process.env.DEBUG_AI) {
        console.debug('[PERSONALITY-EXTRACT] Key validation:', {
          hasCurrentKey: !!currentKey,
          keyLength: currentKey?.length || 0,
          keyFormat: currentKey ? currentKey.substring(0, 10) + '...' : 'None'
        })
      }

      if (currentKey && !this.isValidKeyFormat(currentKey)) {
        console.error('[PERSONALITY-ERROR] Invalid API key format:', {
          keySource,
          keyPrefix: currentKey.substring(0, 10) + '...'
        })
        return this.createFallbackResponse(
          "There's an issue with the API key format. Please check your OpenAI API key in Settings.",
          'guidance'
        )
      }

      // Handle initial message generation - only if truly initial
      const userMessages = messages.filter(m => m.role === 'user')
      if (initialMessage || userMessages.length === 0) {
        if (process.env.DEBUG_AI) {
          console.debug('[PERSONALITY-EXTRACT] Generating initial message')
        }
        return await this.generateInitialMessage(client)
      }

      // Calculate conversation state
      if (process.env.DEBUG_AI) {
        console.debug('[PERSONALITY-EXTRACT] Analyzing conversation state')
      }
      const conversationState = this.analyzeConversationState(messages, currentConfig, confirmedTraits)

      if (process.env.DEBUG_AI) {
        console.debug('[PERSONALITY-EXTRACT] Conversation state:', {
          stage: conversationState.stage,
          fieldsCollected: conversationState.fieldsCollected,
          userMessages: userMessages.length,
          missingFields: conversationState.missingFields?.slice(0, 3)
        })
      }

      // Generate contextual system prompt
      const systemPrompt = this.buildPersonalityExtractionPrompt(conversationState)

      // CRITICAL DEBUG: Log conversation content for trait extraction analysis
      console.log('[TRAIT-EXTRACTION-DEBUG] Conversation analysis:', {
        totalUserMessages: userMessages.length,
        conversationKeywords: userMessages.join(' ').toLowerCase().split(' ').filter(w => 
          ['humor', 'humorous', 'joke', 'funny', 'help', 'helpful', 'casual', 'formal', 'creative', 'analytical', 'style', 'communication', 'friendly', 'professional', 'direct', 'detailed', 'concise'].includes(w)
        ),
        conversationSample: userMessages.slice(-3).map(msg => ({
          content: msg.content,
          length: msg.content.length,
          hasPersonalityWords: /humor|help|casual|creative|fun|serious|friendly|professional|style|communication|direct|detailed|concise/i.test(msg.content),
          hasStyleWords: /style|approach|way|manner|method|communicate|talk|speak|respond|reply|tone|vibe/i.test(msg.content),
          extractableStyleTags: msg.content.match(/\b(friendly|professional|casual|formal|humorous|serious|direct|detailed|concise|creative|analytical|supportive|energetic|calm)\b/gi) || []
        })),
        // Enhanced extraction context
        fullConversationText: userMessages.join(' ').substring(0, 500) + '...',
        extractionHints: {
          mentionedStyles: userMessages.join(' ').match(/\b(friendly|professional|casual|formal|humorous|serious|direct|detailed|concise|creative|analytical|supportive|energetic|calm)\b/gi) || [],
          mentionedCommunication: userMessages.join(' ').match(/\b(brief|detailed|conversational|formal|informal|quick|thorough)\b/gi) || []
        }
      })

      if (process.env.DEBUG_AI) {
        console.debug('[PERSONALITY-EXTRACT] Making OpenAI API call with prompt length:', systemPrompt.length)
      }

      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10) // Only use last 10 messages to prevent token overflow
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 800
      })

      if (process.env.DEBUG_AI) {
        console.debug('[PERSONALITY-EXTRACT] OpenAI request successful')
      }

      const content = response.choices[0]?.message?.content || '{}'

      if (process.env.DEBUG_AI) {
        console.debug('[PERSONALITY-EXTRACT] OpenAI response received, length:', content.length)
        console.debug('[PERSONALITY-DEBUG] Raw OpenAI response preview:', content.substring(0, 200) + (content.length > 200 ? '...' : ''))
      }

      const result = this.processExtractionResponse(content, conversationState)

      // CRITICAL: Log trait extraction details
      console.log('[TRAIT-EXTRACTION-DEBUG] AI response processing:', {
        personaMode: result.personaMode,
        isComplete: result.isComplete,
        showChipSelector: result.showChipSelector,
        extractedFields: Object.keys(result.extractedData),
        suggestedTraitsCount: result.suggestedTraits?.length || 0,
        suggestedTraits: result.suggestedTraits,
        conversationContext: conversationState.conversationContext,
        // Enhanced field-specific logging
        toneDescription: result.extractedData.toneDescription,
        styleTags: result.extractedData.styleTags,
        communicationStyle: result.extractedData.communicationStyle,
        extractedDataFull: result.extractedData
      })

      if (process.env.DEBUG_AI) {
        console.debug('[PERSONALITY-EXTRACT] Extraction completed:', {
          personaMode: result.personaMode,
          isComplete: result.isComplete,
          showChipSelector: result.showChipSelector,
          extractedFields: Object.keys(result.extractedData)
        })
      }

      return result

    } catch (error: any) {
      console.error('[PERSONALITY-ERROR] Extraction failed:', {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.constructor.name,
        stack: error.stack?.split('\n').slice(0, 5)
      })

      // Check if it's an API key or quota issue
      if (error.code === 'insufficient_quota' || error.status === 429) {
        console.error('[PERSONALITY-ERROR] OpenAI quota exceeded')
        return this.createFallbackResponse(
          "I'm having trouble accessing the AI service right now. Let's continue manually - what kind of content do you create?",
          'guidance',
          true
        )
      }

      if (error.code === 'invalid_api_key' || error.status === 401) {
        console.error('[PERSONALITY-ERROR] Invalid OpenAI API key - authentication failed')
        console.error('[PERSONALITY-ERROR] User needs to provide valid OpenAI API key for GPT extraction to work')
        return this.createFallbackResponse(
          "The AI extraction system needs a valid OpenAI API key to work properly. For now, let's continue manually - tell me about your communication style and I'll help you set up your personality traits.",
          'guidance',
          true
        )
      }

      // Default fallback for other errors
      return this.createFallbackResponse(
        "AI Voice Setup is currently unavailable due to technical difficulties. Please visit the Settings > Avatar page to configure your personality traits manually.",
        'guidance',
        true,
        true
      )
    }
  }

  /**
   * Creates a fallback response with consistent structure
   */
  private createFallbackResponse(
    responseText: string, 
    personaMode: 'guidance' | 'blended' | 'persona_preview' = 'guidance',
    isComplete: boolean = false,
    shouldShowManualSetup: boolean = false
  ): any {
    return {
      response: responseText,
      extractedData: {},
      isComplete: false,
      personaMode,
      confidenceScore: 0,
      showChipSelector: false,
      suggestedTraits: [],
      reflectionCheckpoint: false,
      ...(shouldShowManualSetup && { shouldRedirectToManualSetup: true }),
      sessionState: fallbackUsed ? {
        fallbackUsed: true,
        errorRecovery: true,
        timestamp: new Date().toISOString()
      } : undefined
    }
  }

  /**
   * Generates the initial conversation message
   */
  private async generateInitialMessage(client: OpenAI): Promise<any> {
    const fallbackQuestions = [
      "I'm curious - when someone asks you a question in your comments, what's your natural instinct? Do you dive deep, keep it snappy, or something in between?",
      "Hey there! I'm excited to help you create your AI avatar. Let's start with something fun - if your biggest fan asked you to describe your communication style in three words, what would they be?",
      "Here's something I'm wondering - when you're responding to your audience, do you find yourself being more of a teacher, a friend, or something else entirely?",
      "Let's dive in! When someone compliments your content, what's your typical response style? Quick and grateful, or do you love to chat back and forth?"
    ]

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'user', 
            content: `Generate a warm, engaging opening question that feels like starting a conversation with a friend. Choose from these approaches:

            1. SCENARIO: "Imagine your best follower just asked..."
            2. STORY PROMPT: "Tell me about a time when..."
            3. COMPARISON: "How would you describe the difference between..."
            4. DIRECT CURIOSITY: "What's something people always notice about..."
            5. EXAMPLE-DRIVEN: "Give me an example of how you usually..."

            Keep it under 40 words, make it feel natural and conversational, and focus on getting them talking about how they naturally communicate with their audience.

            Return only the question, no extra formatting or explanation.` 
          }
        ],
        temperature: 0.8,
        max_tokens: 80,
      })

      const initialQuestion = response.choices[0]?.message?.content?.trim() || 
        fallbackQuestions[0]

      return {
        response: initialQuestion,
        extractedData: {},
        isComplete: false,
        personaMode: 'guidance',
        confidenceScore: 0,
        showChipSelector: false,
        suggestedTraits: [],
        reflectionCheckpoint: false
      }
    } catch (error: any) {
      console.error('[PERSONALITY-ERROR] Failed to generate initial message:', error.message || error)

      // Return a random fallback question
      const randomFallback = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)]

      return {
        response: randomFallback,
        extractedData: {},
        isComplete: false,
        personaMode: 'guidance',
        confidenceScore: 0,
        showChipSelector: false,
        suggestedTraits: [],
        reflectionCheckpoint: false,
        fallbackUsed: true
      }
    }
  }

  /**
   * Analyzes the current conversation state to determine next steps
   */
  private analyzeConversationState(messages: any[], currentConfig: Partial<AvatarPersonaConfig>, confirmedTraits?: string[]): any {
    const userMessages = messages.filter(m => m.role === 'user')
    const fieldsCollected = this.countMeaningfulFields(currentConfig)

    // Extract conversation context for better flow
    const conversationContext = this.extractConversationContext(messages)

    // Stage determination with more natural flow
    const stage = this.determineConversationStage(userMessages.length, fieldsCollected, confirmedTraits)

    // Missing field analysis - ordered by priority and conversation flow
    const missingFields = this.identifyMissingFields(currentConfig)

    // Enhanced state tracking
    const state = {
      userMessageCount: userMessages.length,
      fieldsCollected,
      stage,
      missingFields,
      hasConfirmedTraits: Boolean(confirmedTraits),
      currentConfig,
      conversationContext, // Add context for better flow
      shouldShowChipCloud: stage === 'reflection_checkpoint',
      shouldComplete: stage === 'completion',
      lastUserMessage: userMessages[userMessages.length - 1]?.content || '',
      conversationTone: this.assessConversationTone(messages)
    }

    if (process.env.DEBUG_AI) {
      console.log('[PERSONALITY-DEBUG] Enhanced conversation state:', {
        userMessages: userMessages.length,
        fieldsCollected,
        stage,
        conversationTone: state.conversationTone,
        missingFields: missingFields.slice(0, 2),
        hasConfirmedTraits: Boolean(confirmedTraits)
      })
    }

    return state
  }

  /**
   * Extracts conversation context for better flow
   */
  private extractConversationContext(messages: any[]): any {
    const recentMessages = messages.slice(-4) // Last 4 messages for context

    return {
      topics: this.extractMentionedTopics(recentMessages),
      examples: this.extractUserExamples(recentMessages),
      tone: this.detectUserTone(recentMessages),
      interests: this.extractMentionedTopics(recentMessages) // Use topics as interests for now
    }
  }

  /**
   * Assesses the conversation tone for matching
   */
  private assessConversationTone(messages: any[]): string {
    const userMessages = messages.filter(m => m.role === 'user').slice(-3)
    if (userMessages.length === 0) return 'neutral'

    const combinedText = userMessages.map(m => m.content).join(' ').toLowerCase()

    if (combinedText.includes('!') || combinedText.includes('haha') || combinedText.includes('lol')) {
      return 'enthusiastic'
    } else if (combinedText.length > 100) {
      return 'detailed'
    } else if (combinedText.split(' ').length < 10) {
      return 'concise'```text
    }
    return 'balanced'
  }

  /**
   * Extracts mentioned topics from conversation
   */
  private extractMentionedTopics(messages: any[]): string[] {
    const topicKeywords = [
      'business', 'fitness', 'health', 'technology', 'travel', 'food', 'art', 'music',
      'education', 'finance', 'marketing', 'design', 'coding', 'writing', 'photography'
    ]

    const content = messages.map(m => m.content).join(' ').toLowerCase()
    return topicKeywords.filter(topic => content.includes(topic))
  }

  /**
   * Extracts user examples from conversation
   */
  private extractUserExamples(messages: any[]): string[] {
    const userMessages = messages.filter(m => m.role === 'user')
    return userMessages
      .filter(m => m.content.includes('example') || m.content.includes('like') || m.content.includes('such as'))
      .map(m => m.content)
      .slice(0, 3)
  }

  /**
   * Detects user tone from recent messages
   */
  private detectUserTone(messages: any[]): string {
    const userMessages = messages.filter(m => m.role === 'user')
    if (userMessages.length === 0) return 'neutral'

    const combinedText = userMessages.map(m => m.content).join(' ').toLowerCase()

    if (combinedText.includes('excited') || combinedText.includes('amazing') || combinedText.includes('!')) {
      return 'enthusiastic'
    } else if (combinedText.includes('professional') || combinedText.includes('business')) {
      return 'professional'
    } else if (combinedText.includes('fun') || combinedText.includes('humor') || combinedText.includes('joke')) {
      return 'casual'
    }
    return 'balanced'
  }

  /**
   * Determines conversation stage based on progress
   */
  private determineConversationStage(userMessageCount: number, fieldsCollected: number, confirmedTraits?: string[]): string {
    if (confirmedTraits && confirmedTraits.length > 0) {
      return 'completion'
    } else if (userMessageCount >= 7 && fieldsCollected >= 2) {
      return 'reflection_checkpoint'
    } else if (userMessageCount >= 4 && fieldsCollected >= 1) {
      return 'discovery'
    } else if (userMessageCount >= 1) {
      return 'introduction'
    }
    return 'initial'
  }

  /**
   * Identifies missing fields in current config
   */
  private identifyMissingFields(config: Partial<AvatarPersonaConfig>): string[] {
    const requiredFields = [
      'avatarObjective',
      'audienceDescription', 
      'toneDescription',
      'styleTags',
      'communicationPrefs',
      'boundaries'
    ]

    return requiredFields.filter(field => {
      const value = config[field as keyof AvatarPersonaConfig]
      if (!value) return true
      if (typeof value === 'string') return value.length < 3
      if (Array.isArray(value)) return value.length === 0
      return false
    })
  }

  /**
   * Counts meaningful fields in current config
   */
  private countMeaningfulFields(config: Partial<AvatarPersonaConfig>): number {
    return countValidFields(config)
  }

  /**
   * Builds the personality extraction prompt based on conversation state
   */
  private buildPersonalityExtractionPrompt(conversationState: any): string {
    const { stage, missingFields, conversationTone, lastUserMessage } = conversationState

    const basePrompt = `You are an AI personality coach helping someone set up their digital avatar. Your role is to:

1. **Extract individual personality traits** from conversation in specific formats
2. **Generate natural follow-up responses** to continue the conversation
3. **Suggest trait validation** when appropriate

## CRITICAL: Extract Individual Terms Only

For trait cloud display, extract these parameters as arrays of individual adjectives:

- **toneTraits**: 3-5 individual tone adjectives (e.g., ["Friendly", "Professional", "Enthusiastic"])
- **styleTags**: 3-5 individual style terms (e.g., ["Conversational", "Detailed", "Direct"])  
- **communicationPrefs**: 3-5 individual communication preferences (e.g., ["Concise", "Example-driven", "Interactive"])

## Response Format

Return valid JSON with this structure:
{
  "response": "Your natural conversational response (keep it under 120 words)",
  "extractedData": {
    "toneTraits": ["Friendly", "Warm"],
    "styleTags": ["Conversational", "Detailed"], 
    "communicationPrefs": ["Interactive", "Example-driven"],
    "toneDescription": "Brief description of overall tone",
    "avatarObjective": ["Main goal or purpose"],
    "audienceDescription": "Target audience description",
    "boundaries": ["Any mentioned limits"],
    "allowedTopics": ["Topics they're comfortable with"],
    "restrictedTopics": ["Topics to avoid"]
  },
  "showChipSelector": false,
  "suggestedTraits": [],
  "personaMode": "guidance",
  "confidenceScore": 0.7,
  "isComplete": false
}

## Conversation Stage: ${stage}

${stage === 'reflection_checkpoint' ? `
**TRIGGER TRAIT CLOUD**: Set "showChipSelector": true and generate suggestedTraits with this structure:
[
  {"id": "1", "label": "TraitName", "selected": true, "type": "extracted"},
  {"id": "2", "label": "RelatedTrait", "selected": false, "type": "adjacent"},
  {"id": "3", "label": "OppositeTrait", "selected": false, "type": "antonym"}
]
` : ''}

## Current Analysis Context
- Missing fields: ${missingFields?.slice(0, 3).join(', ') || 'None'}
- User message count: ${conversationState.userMessageCount}
- Conversation tone: ${conversationTone}
- Last message: "${lastUserMessage?.substring(0, 100) || 'None'}"

Remember: Extract INDIVIDUAL TERMS only, not phrases. Focus on building natural conversation while gathering personality insights.`

    return basePrompt
  }

  /**
   * Processes the AI extraction response
   */
  private processExtractionResponse(content: string, conversationState: any): any {
    try {
      const parsed = JSON.parse(content)

      // Validate and clean extracted data
      const extractedData = this.validateExtractedData(parsed.extractedData || {})

      // Determine if chip selector should be shown
      const showChipSelector = parsed.showChipSelector || conversationState.stage === 'reflection_checkpoint'

      // Generate suggested traits if chip selector is active
      let suggestedTraits = parsed.suggestedTraits || []
      
// Generate suggested traits for trait cloud
        if (showChipSelector) {
          console.log('[AI-EXTRACTION] Generating trait suggestions for chip selector')

          // Extract traits from the current config with proper type marking
          const extractedTraits: any[] = []

          // PRIORITY 1: Add traits from toneTraits (mark as extracted)
          if (extractedData.toneTraits?.length > 0) {
            extractedData.toneTraits.forEach((trait: string, index) => {
              extractedTraits.push({
                id: `tone-extracted-${index}`,
                label: trait,
                selected: true,
                type: 'extracted' as const,
                category: 'tone'
              })
            })
            console.log('[AI-EXTRACTION] Added tone traits as extracted:', extractedData.toneTraits)
          }

          // PRIORITY 2: Add traits from styleTags (mark as extracted)
          if (extractedData.styleTags?.length > 0) {
            extractedData.styleTags.forEach((trait: string, index) => {
              extractedTraits.push({
                id: `style-extracted-${index}`,
                label: trait,
                selected: true,
                type: 'extracted' as const,
                category: 'style'
              })
            })
            console.log('[AI-EXTRACTION] Added style traits as extracted:', extractedData.styleTags)
          }

          // PRIORITY 3: Add traits from communicationPrefs (mark as extracted)
          if (extractedData.communicationPrefs?.length > 0) {
            extractedData.communicationPrefs.forEach((trait: string, index) => {
              extractedTraits.push({
                id: `comm-extracted-${index}`,
                label: trait,
                selected: true,
                type: 'extracted' as const,
                category: 'communication'
              })
            })
            console.log('[AI-EXTRACTION] Added communication traits as extracted:', extractedData.communicationPrefs)
          }

          // FALLBACK: If no individual traits available, parse from descriptions
          if (extractedTraits.length === 0) {
            console.log('[AI-EXTRACTION] No individual traits found, parsing from descriptions...')

            // Parse tone description for adjectives
            if (extractedData.toneDescription) {
              const toneWords = extractedData.toneDescription
                .split(/[,\s]+/)
                .filter(word => word.length > 3 && /^[a-zA-Z]+$/.test(word))
                .slice(0, 3)

              toneWords.forEach((word, index) => {
                extractedTraits.push({
                  id: `tone-parsed-${index}`,
                  label: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
                  selected: true,
                  type: 'extracted' as const,
                  category: 'tone'
                })
              })
              console.log('[AI-EXTRACTION] Parsed traits from toneDescription:', toneWords)
            }
          }

          // Generate adjacent traits (2-3 per extracted trait)
          const adjacentTraits: any[] = []
          extractedTraits.forEach((trait, baseIndex) => {
            const relatedTerms = this.generateAdjacentTraits(trait.label ? [trait.label]:[])
            relatedTerms.slice(0, 2).forEach((relatedTrait, index) => {
              adjacentTraits.push({
                id: `adjacent-${baseIndex}-${index}`,
                label: relatedTrait,
                selected: false,
                type: 'adjacent' as const,
                category: trait.category || 'tone',
                relatedTo: trait.id
              })
            })
          })

          // Generate antonym traits (1-2 per extracted trait)
          const antonymTraits: any[] = []
          extractedTraits.slice(0, 2).forEach((trait, baseIndex) => {
            const oppositeTerms = this.generateAntonymTraits(trait.label ? [trait.label]:[])
            oppositeTerms.slice(0, 1).forEach((antonymTrait, index) => {
              antonymTraits.push({
                id: `antonym-${baseIndex}-${index}`,
                label: antonymTrait,
                selected: false,
                type: 'antonym' as const,
                category: trait.category || 'tone',
                relatedTo: trait.id
              })
            })
          })

          // Combine all traits with extracted first
          suggestedTraits = [...extractedTraits, ...adjacentTraits, ...antonymTraits]

          console.log('[AI-EXTRACTION] Generated trait breakdown with proper types:', {
            extracted: extractedTraits.length,
            extractedTraits: extractedTraits.map(t => `${t.label} (${t.type})`),
            adjacent: adjacentTraits.length,
            antonym: antonymTraits.length,
            total: suggestedTraits.length
          })
        }

      return {
        response: parsed.response || "Let's continue building your personality profile.",
        extractedData,
        showChipSelector,
        suggestedTraits,
        personaMode: parsed.personaMode || 'guidance',
        confidenceScore: parsed.confidenceScore || 0.5,
        isComplete: parsed.isComplete || false,
        reflectionCheckpoint: showChipSelector
      }
    } catch (error) {
      console.error('[PERSONALITY-ERROR] Failed to parse AI response:', error)
      return this.createFallbackResponse("I had trouble processing that. Could you tell me more about your communication style?", 'guidance')
    }
  }

  /**
   * Validates and cleans extracted data to ensure individual terms
   */
  private validateExtractedData(data: any): Partial<AvatarPersonaConfig> {
    const cleaned: any = {}

    // Ensure toneTraits are individual terms
    if (data.toneTraits && Array.isArray(data.toneTraits)) {
      cleaned.toneTraits = data.toneTraits.filter(t => typeof t === 'string' && t.length < 20)
    }

    // Ensure styleTags are individual terms  
    if (data.styleTags && Array.isArray(data.styleTags)) {
      cleaned.styleTags = data.styleTags.filter(t => typeof t === 'string' && t.length < 20)
    }

    // Ensure communicationPrefs are individual terms
    if (data.communicationPrefs && Array.isArray(data.communicationPrefs)) {
      cleaned.communicationPrefs = data.communicationPrefs.filter(t => typeof t === 'string' && t.length < 20)
    }

    // Copy other fields as-is
    const otherFields = ['toneDescription', 'avatarObjective', 'audienceDescription', 'boundaries', 'allowedTopics', 'restrictedTopics']
    otherFields.forEach(field => {
      if (data[field]) {
        cleaned[field] = data[field]
      }
    })

    return cleaned
  }

  /**
   * Generates fallback traits when AI doesn't provide them
   */
  private generateFallbackTraits(extractedData: any, conversationState: any): any[] {
    const traits: any[] = []
    let idCounter = 1

    // Extract from toneTraits
    if (extractedData.toneTraits?.length > 0) {
      extractedData.toneTraits.forEach((trait: string) => {
        traits.push({
          id: (idCounter++).toString(),
          label: trait,
          selected: true,
          type: 'extracted'
        })
      })
    }

    // Extract from styleTags
    if (extractedData.styleTags?.length > 0) {
      extractedData.styleTags.forEach((trait: string) => {
        traits.push({
          id: (idCounter++).toString(),
          label: trait,
          selected: true,
          type: 'extracted'
        })
      })
    }

    // Extract from communicationPrefs
    if (extractedData.communicationPrefs?.length > 0) {
      extractedData.communicationPrefs.forEach((trait: string) => {
        traits.push({
          id: (idCounter++).toString(),
          label: trait,
          selected: true,
          type: 'extracted'
        })
      })
    }

    // Add adjacent traits
    const adjacentTraits = this.generateAdjacentTraits(traits.map(t => t.label))
    adjacentTraits.forEach(trait => {
      traits.push({
        id: (idCounter++).toString(),
        label: trait,
        selected: false,
        type: 'adjacent'
      })
    })

    // Add antonym traits
    const antonymTraits = this.generateAntonymTraits(traits.filter(t => t.type === 'extracted').map(t => t.label))
    antonymTraits.forEach(trait => {
      traits.push({
        id: (idCounter++).toString(),
        label: trait,
        selected: false,
        type: 'antonym'
      })
    })

    return traits
  }

  /**
   * Generates adjacent/related traits
   */
  private generateAdjacentTraits(baseTraits: string[]): string[] {
    const adjacentMap: Record<string, string[]> = {
      'Friendly': ['Warm', 'Welcoming', 'Approachable'],
      'Professional': ['Polished', 'Competent', 'Reliable'],
      'Humorous': ['Playful', 'Witty', 'Entertaining'],
      'Direct': ['Clear', 'Straightforward', 'Honest'],
      'Creative': ['Innovative', 'Imaginative', 'Original'],
      'Analytical': ['Logical', 'Systematic', 'Detail-oriented'],
      'Conversational': ['Informal', 'Chatty', 'Engaging'],
      'Detailed': ['Thorough', 'Comprehensive', 'Meticulous']
    }

    const adjacent: string[] = []
    baseTraits.forEach(trait => {
      const related = adjacentMap[trait] || []
      adjacent.push(...related.slice(0, 2))
    })

    return [...new Set(adjacent)].slice(0, 6)
  }

  /**
   * Generates antonym/opposite traits
   */
  private generateAntonymTraits(baseTraits: string[]): string[] {
    const antonymMap: Record<string, string[]> = {
      'Friendly': ['Formal', 'Reserved'],
      'Professional': ['Casual', 'Relaxed'],
      'Humorous': ['Serious', 'Formal'],
      'Direct': ['Indirect', 'Diplomatic'],
      'Creative': ['Traditional', 'Conventional'],
      'Analytical': ['Intuitive', 'Spontaneous'],
      'Conversational': ['Formal', 'Structured'],
      'Detailed': ['Concise', 'Brief']
    }

    const antonyms: string[] = []
    baseTraits.forEach(trait => {
      const opposite = antonymMap[trait] || []
      antonyms.push(...opposite.slice(0, 1))
    })

    return [...new Set(antonyms)].slice(0, 4)
  }
}

export const aiService = new AIService()