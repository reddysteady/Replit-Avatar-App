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
    const { client, hasKey } = await this.getClient()
    if (!hasKey) {
      return this.createFallbackResponse("I'm having trouble processing right now. Could you try again?")
    }

    // Handle initial message generation with improved prompting
    if (initialMessage && messages.length === 1 && messages[0].role === 'system') {
      return this.generateInitialMessage(client)
    }

    // Calculate conversation state
    const conversationState = this.analyzeConversationState(messages, currentConfig, confirmedTraits)
    
    // Generate contextual system prompt
    const systemPrompt = this.buildPersonalityExtractionPrompt(conversationState)

    try {
      if (process.env.DEBUG_AI) {
        console.debug('[DEBUG-AI] Personality extraction request:', conversationState)
      }

      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10) // Only use last 10 messages to prevent token overflow
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 800 // Increased for better responses
      })

      const content = response.choices[0]?.message?.content || '{}'
      console.log('[PERSONALITY-DEBUG] Raw OpenAI response:', content.substring(0, 200) + (content.length > 200 ? '...' : ''))

      return this.processExtractionResponse(content, conversationState)

    } catch (error: any) {
      console.error('Error extracting personality:', error)
      return this.handleExtractionError(error, conversationState)
    }
  }

  /**
   * Creates a fallback response with consistent structure
   */
  private createFallbackResponse(responseText: string, personaMode: 'guidance' | 'blended' | 'persona_preview' = 'guidance'): any {
    return {
      response: responseText,
      extractedData: {},
      isComplete: false,
      personaMode,
      confidenceScore: 0,
      showChipSelector: false,
      suggestedTraits: [],
      reflectionCheckpoint: false
    }
  }

  /**
   * Generates the initial conversation message
   */
  private async generateInitialMessage(client: OpenAI): Promise<any> {
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

      const initialQuestion = response.choices[0]?.message?.content || 
        "I'm curious - when someone asks you a question in your comments, what's your natural instinct? Do you dive deep, keep it snappy, or something in between?"

      return {
        response: initialQuestion.trim(),
        extractedData: {},
        isComplete: false,
        personaMode: 'guidance',
        confidenceScore: 0,
        showChipSelector: false,
        suggestedTraits: [],
        reflectionCheckpoint: false
      }
    } catch (error: any) {
      console.error('Error generating initial message:', error.message || error)
      return {
        response: "I'm curious - when someone asks you a question in your comments, what's your natural instinct? Do you dive deep, keep it snappy, or something in between?",
        extractedData: {},
        isComplete: false,
        personaMode: 'guidance',
        confidenceScore: 0,
        showChipSelector: false,
        suggestedTraits: [],
        reflectionCheckpoint: false
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
      interests: this.extractInterests(recentMessages)
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
      return 'concise'
    }
    return 'balanced'
  }

  /**
   * Extracts mentioned topics from recent messages
   */
  private extractMentionedTopics(messages: any[]): string[] {
    const topics = []
    const combinedText = messages.filter(m => m.role === 'user')
      .map(m => m.content).join(' ').toLowerCase()
    
    const commonTopics = ['fitness', 'health', 'business', 'tech', 'creative', 'education', 'lifestyle']
    commonTopics.forEach(topic => {
      if (combinedText.includes(topic)) topics.push(topic)
    })
    
    return topics
  }

  /**
   * Extracts user examples from conversation
   */
  private extractUserExamples(messages: any[]): string[] {
    return messages
      .filter(m => m.role === 'user' && (m.content.includes('like') || m.content.includes('example')))
      .map(m => m.content.substring(0, 50))
  }

  /**
   * Detects user's communication tone
   */
  private detectUserTone(messages: any[]): string {
    const userText = messages.filter(m => m.role === 'user').map(m => m.content).join(' ')
    
    if (userText.includes('!') && userText.includes('love')) return 'enthusiastic'
    if (userText.includes('professional') || userText.includes('business')) return 'professional'
    if (userText.includes('casual') || userText.includes('fun')) return 'casual'
    
    return 'balanced'
  }

  /**
   * Counts meaningful fields in the configuration for Phase 1 core parameters
   */
  private countMeaningfulFields(config: Partial<AvatarPersonaConfig>): number {
    const coreFields = ['toneDescription', 'audienceDescription', 'avatarObjective', 'boundaries', 'communicationPrefs', 'fallbackReply'];
    return coreFields.filter(key => {
      const value = config[key];
      if (!value) return false;
      
      if (typeof value === 'string') return value.length > 3;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      
      return false;
    }).length;
  }
  
  /**
   * Calculates confidence score based on core parameter completeness
   */
  private calculateConfidence(config: Partial<AvatarPersonaConfig>, extractedData: any): number {
    const totalCoreParams = 4; // Reduced for Phase 1
    const filledParams = this.countMeaningfulFields({...config, ...extractedData});
    return Math.min(0.95, filledParams / totalCoreParams);
  }

  /**
   * Determines the current conversation stage for Phase 1 simplified flow
   */
  private determineConversationStage(userMessages: number, fieldsCollected: number, confirmedTraits?: string[]): string {
    // Simple linear progression - never jump stages prematurely
    if (userMessages <= 1) return 'introduction'
    
    // Show chip validation after every 2 parameters collected (simplified from 3)
    if (fieldsCollected >= 2 && fieldsCollected % 2 === 0 && !confirmedTraits) {
      return 'reflection_checkpoint'
    }
    
    // Only move to completion after ALL 6 core parameters + chip validation
    if (fieldsCollected >= 6 && confirmedTraits) {
      return 'completion'
    }
    
    // Stay in core collection until requirements are met
    return 'core_collection'
  }

  /**
   * Identifies which Phase 1 core fields are still missing
   */
  private identifyMissingFields(config: Partial<AvatarPersonaConfig>): string[] {
    const coreFields = [
      'toneDescription', // baseline tone
      'audienceDescription', // audience understanding
      'avatarObjective', // primary goals
      'boundaries', // restricted topics/boundaries
      'fallbackReply' // fallback response
    ];
    
    return coreFields.filter(field => {
      const value = config[field];
      if (!value) return true;
      if (Array.isArray(value) && value.length === 0) return true;
      if (typeof value === 'string' && value.length < 5) return true;
      return false;
    });
  }

  /**
   * Builds a contextual system prompt for Phase 1 core parameter extraction
   */
  private buildPersonalityExtractionPrompt(state: any): string {
    const { stage, fieldsCollected, missingFields, userMessageCount, hasConfirmedTraits } = state
    
    // Create more engaging, varied question approaches
    const questionStyles = [
      "scenario-based", "direct-curious", "story-prompt", "comparison", "example-driven"
    ]
    const currentStyle = questionStyles[userMessageCount % questionStyles.length]
    
    let stageInstructions = ''
    let responseFormat = ''
    
    switch (stage) {
      case 'introduction':
        stageInstructions = `Ask an engaging ${currentStyle} question that gets them talking naturally about their voice and style. Make it feel like a conversation, not an interview.`
        break
      case 'core_collection':
        const nextField = missingFields[0] || 'communication style'
        stageInstructions = `Continue the natural conversation flow while learning about "${nextField}". Use ${currentStyle} approach. Build on what they've shared already. Make it conversational and engaging.`
        break
      case 'reflection_checkpoint':
        stageInstructions = 'REFLECTION PHASE: Summarize what you\'ve learned in a personal way, then show chip selector for validation.'
        responseFormat = '"showChipSelector": true, "reflectionCheckpoint": true,'
        break
      case 'completion':
        stageInstructions = 'Transition to their voice naturally. Show excitement about capturing their personality.'
        responseFormat = '"isComplete": true, "isFinished": true,'
        break
      default:
        stageInstructions = `Keep the conversation flowing naturally while learning about ${missingFields[0] || 'their style'}. Use ${currentStyle} approach.`
    }

    return `You are learning someone's communication personality through natural, engaging conversation. This should feel like chatting with a friend who's genuinely curious about how they express themselves.

CONVERSATION APPROACH:
- ${currentStyle} style for this interaction
- Build on previous responses naturally
- Ask follow-up questions that show you're listening
- Use their own words and examples back to them
- Make each question feel different and engaging

CORE AREAS TO EXPLORE (organically):
1. toneDescription - How they naturally sound when talking
2. audienceDescription - Who they're speaking to
3. avatarObjective - What they want to achieve
4. boundaries - What they prefer not to discuss
5. fallbackReply - How they handle sensitive topics
6. communicationPrefs - Their natural style preferences

CURRENT STATE:
- Conversation style: ${currentStyle}
- Questions asked: ${userMessageCount}
- Areas explored: ${fieldsCollected}/6
- Still learning about: ${missingFields.slice(0, 2).join(', ')}
- Ready for validation: ${hasConfirmedTraits ? 'Yes' : 'No'}

${stageInstructions}

RESPONSE STYLE GUIDELINES:
- Vary your question formats (scenarios, examples, comparisons, stories)
- Reference what they've already shared to show you're listening
- Keep it conversational and warm, not clinical
- Ask follow-ups that dive deeper into interesting details
- Use their energy level and match their communication style

REQUIRED JSON FORMAT:
{
  "response": "Your engaging, conversational question or reflection",
  "extractedData": {fields you can infer from their latest response},
  ${responseFormat}
  "personaMode": "${stage === 'completion' ? 'persona_preview' : stage === 'reflection_checkpoint' ? 'blended' : 'guidance'}",
  "confidenceScore": ${Math.min(0.95, fieldsCollected / 6)}
}`
  }

  /**
   * Processes the OpenAI response and formats the result
   */
  private processExtractionResponse(content: string, state: any): any {
    let result
    try {
      result = JSON.parse(content)
    } catch (parseError) {
      console.error('JSON parse error, content was:', content)
      return this.createFallbackResponse(
        "Let me try a different approach - what's the most important thing your audience values about how you communicate?"
      )
    }

    // Validate response structure and extract data
    const responseText = result.response || "Tell me more about your communication style."
    const extractedData = this.cleanExtractedData(result.extractedData || {})
    
    // Generate suggested traits for chip selector
    const suggestedTraits = this.generateSuggestedTraits(extractedData, state.currentConfig)
    
    // Calculate total fields after extraction
    const totalFields = state.fieldsCollected + Object.keys(extractedData).length
    
    const finalResult = {
      response: responseText,
      extractedData,
      personaMode: result.personaMode || 'guidance',
      isComplete: false, // Never complete until explicitly in completion stage
      isFinished: false, // Never finished until explicitly in completion stage
      confidenceScore: Math.min(0.95, totalFields / 6),
      transitionMessage: this.generateTransitionMessage(result.personaMode, state.stage),
      showChipSelector: result.showChipSelector || false,
      suggestedTraits,
      reflectionCheckpoint: result.reflectionCheckpoint || false
    }
    
    // Only set completion flags if we're actually in completion stage
    if (state.stage === 'completion') {
      finalResult.isComplete = true
      finalResult.isFinished = true
    }

    if (process.env.DEBUG_AI) {
      console.log('[PERSONALITY-DEBUG] Processed result:', {
        stage: state.stage,
        newFieldsExtracted: Object.keys(extractedData),
        personaMode: finalResult.personaMode,
        showChipSelector: finalResult.showChipSelector
      })
    }

    return finalResult
  }

  /**
   * Cleans and validates extracted data
   */
  private cleanExtractedData(data: any): Partial<AvatarPersonaConfig> {
    const cleaned: any = {}
    
    Object.keys(data).forEach(key => {
      const value = data[key]
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'string' && value.length > 2) {
          cleaned[key] = value.trim()
        } else if (Array.isArray(value) && value.length > 0) {
          cleaned[key] = value.filter(item => item && item.length > 0)
        }
      }
    })

    return cleaned
  }

  /**
   * Generates suggested traits based on extracted data
   */
  private generateSuggestedTraits(extractedData: any, currentConfig: any): Array<{id: string, label: string, selected: boolean}> {
    const traits = []
    let idCounter = 1

    // Extract traits from tone description
    if (extractedData.toneDescription || currentConfig.toneDescription) {
      const toneText = (extractedData.toneDescription || currentConfig.toneDescription).toLowerCase()
      const commonTraits = ['friendly', 'professional', 'casual', 'humorous', 'analytical', 'creative', 'empathetic']
      
      commonTraits.forEach(trait => {
        if (toneText.includes(trait)) {
          traits.push({
            id: (idCounter++).toString(),
            label: trait.charAt(0).toUpperCase() + trait.slice(1),
            selected: true
          })
        }
      })
    }

    // Add style tags if available
    if (extractedData.styleTags) {
      extractedData.styleTags.forEach((tag: string) => {
        traits.push({
          id: (idCounter++).toString(),
          label: tag,
          selected: true
        })
      })
    }

    // Add some common unselected options
    const additionalTraits = ['Direct', 'Supportive', 'Curious', 'Patient']
    additionalTraits.forEach(trait => {
      if (!traits.some(t => t.label.toLowerCase() === trait.toLowerCase())) {
        traits.push({
          id: (idCounter++).toString(),
          label: trait,
          selected: false
        })
      }
    })

    return traits.slice(0, 8) // Limit to 8 traits
  }

  /**
   * Generates transition messages for persona mode changes
   */
  private generateTransitionMessage(personaMode: string, stage: string): string | undefined {
    if (personaMode === 'persona_preview' && stage !== 'persona_preview') {
      return 'Now speaking in your captured personality! 🎭'
    }
    if (personaMode === 'blended' && stage === 'reflection_checkpoint') {
      return 'I\'ve learned your style - let\'s confirm these traits! 🎯'
    }
    return undefined
  }

  /**
   * Handles extraction errors with robust Phase 1 fallbacks
   */
  private handleExtractionError(error: any, state: any): any {
    console.error('[PERSONA-ERROR] Phase 1 extraction error:', error.message)
    
    // Generate targeted question based on missing fields
    const missingField = state.missingFields?.[0]
    const coreQuestions = {
      toneDescription: "How would you describe your natural communication style when talking to your audience?",
      audienceDescription: "Who do you typically create content for? Tell me about your audience.",
      avatarObjective: "What's your main goal when interacting with your community?",
      boundaries: "Are there any topics you prefer not to discuss publicly?",
      fallbackReply: "How should your avatar politely redirect conversations away from sensitive topics?",
      communicationPrefs: "Do you prefer being more concise or detailed in your responses?"
    }

    const fallbackResponse = coreQuestions[missingField] || 
      "Tell me about your communication style when you're engaging with your audience."
    
    return {
      response: fallbackResponse,
      extractedData: {},
      isComplete: false,
      personaMode: 'guidance',
      confidenceScore: 0,
      showChipSelector: false,
      suggestedTraits: [],
      reflectionCheckpoint: false,
      sessionState: {
        fallbackUsed: true,
        errorRecovery: true,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Creates fallback responses with error tracking
   */
  private createFallbackResponse(
    responseText: string, 
    personaMode: 'guidance' | 'blended' | 'persona_preview' = 'guidance',
    fallbackUsed: boolean = false
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
      sessionState: {
        fallbackUsed,
        errorRecovery: true,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Creates a fallback response with consistent structure (overloaded version)
   */
  private createFallbackResponse(responseText: string, personaMode: 'guidance' | 'blended' | 'persona_preview' = 'guidance'): any {
    return {
      response: responseText,
      extractedData: {},
      isComplete: false,
      personaMode,
      confidenceScore: 0,
      showChipSelector: false,
      suggestedTraits: [],
      reflectionCheckpoint: false
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