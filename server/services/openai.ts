/**
 * OpenAI API service
 * Handles interactions with OpenAI for message generation, intent classification,
 * and content moderation
 */
// See CHANGELOG.md for 2025-06-11 [Changed]

import OpenAI from "openai";
import { storage } from "../storage";
import { log } from "../logger";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

interface GenerateReplyParams {
  content: string;
  senderName: string;
  creatorToneDescription: string;
  temperature: number;
  maxLength: number;
  model?: string;
  contextSnippets?: string[]; // Additional context from content RAG pipeline
  flexProcessing?: boolean;
}

interface ClassifyIntentResult {
  isHighIntent: boolean;
  confidence: number;
  category: string;
}

interface DetectSensitiveResult {
  isSensitive: boolean;
  confidence: number;
  category: string;
}

export class AIService {
  constructor() {}

  private async getClient(): Promise<OpenAI | null> {
    const key = process.env.OPENAI_API_KEY || (await storage.getSettings(1)).openaiToken;
    if (process.env.DEBUG_AI) {
      console.debug(
        "[DEBUG-AI] getClient using",
        process.env.OPENAI_API_KEY ? "env" : key ? "settings" : "none"
      );
    }
    return key ? new OpenAI({ apiKey: key }) : null;
  }
  
  /**
   * Generates embeddings for content or queries
   * Used for the RAG pipeline to enable semantic search
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const client = await this.getClient();
    if (!client) {
      if (process.env.DEBUG_AI) console.debug('[DEBUG-AI] generateEmbedding fallback');
      return Array(1536).fill(0);
    }
    try {
      const response = await client.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      return Array(1536).fill(0);
    }
  }

  /**
   * Generates an AI reply to a message based on creator's tone and style
   * with contextual awareness using RAG pipeline
   */
  async generateReply(params: GenerateReplyParams): Promise<string> {
    try {
      const { content, senderName, creatorToneDescription, temperature, maxLength, contextSnippets, flexProcessing, model } = params;

      const client = await this.getClient();
      if (!client) {
        log("OpenAI API key not found. Using fallback reply.");
        return this.generateFallbackReply(content, senderName);
      }

      // Build context from RAG pipeline if available
      let contextSection = "";
      if (contextSnippets && contextSnippets.length > 0) {
        contextSection = `
        IMPORTANT CONTEXT: The following are direct quotes from the creator's content that show their expertise, opinions, and communication style. Use this to ensure your response authentically represents them:
        
        ${contextSnippets.map((snippet, index) => `[${index + 1}] "${snippet}"`).join('\n\n')}
        
        Use the above content to inform your response when relevant. Don't explicitly reference these quotes or mention that you're using them as context. Instead, seamlessly incorporate the creator's expertise, preferences, and tone into your response as if you are truly their digital twin.
        `;
      }

      const systemPrompt = `
        You are the AI avatar of a content creator, acting as their digital twin. Your primary goal is to respond exactly as they would, using their unique voice, expertise, and style.
        
        Creator's tone and communication style:
        ${creatorToneDescription || "Professional, friendly, and helpful with a focus on authentic engagement."}
        
        ${contextSection}
        
        Guidelines:
        - AUTHENTICITY IS CRITICAL: You must sound exactly like the creator would in a direct conversation
        - Keep responses concise and engaging, under ${maxLength} characters
        - Match the creator's exact vocabulary choices, sentence structures, and communication patterns
        - Be warm and personable in a way that reflects the creator's specific style of engagement
        - When answering questions, incorporate the creator's established viewpoints and expertise from their content
        - Never invent facts or preferences about the creator - if you don't have context for something, defer to general advice
        - For product recommendations or specific advice, draw only from the creator's actual preferences in their content
        - If you don't know something specific about the creator's opinion, acknowledge this gracefully and suggest they follow for future updates
        - Never mention that you're an AI, an assistant, or that you're using content snippets
        - Never sign the message with a name, simply respond as if you are the creator
      `;

      const userPrompt = `
        Here is a message from a follower named ${senderName}:
        "${content}"
        
        Write a response that matches the creator's tone and communication style.
        ${contextSnippets && contextSnippets.length > 0 ? "Use the contextual information when it's relevant to the question." : ""}
      `;

      const response = await client.chat.completions.create({
        model: model || DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: temperature,
        max_tokens: maxLength,
        service_tier: flexProcessing ? "flex" : undefined,
      });

      return response.choices[0].message.content || "Thank you for your message!";
    } catch (error: any) {
      console.error("Error generating AI reply:", error.message);
      
      // If there's an API quota error, use fallback reply
      if (error.message.includes("429") || error.message.includes("quota exceeded")) {
        log("OpenAI quota exceeded. Using fallback reply.");
        return this.generateFallbackReply(params.content, params.senderName);
      }
      
      throw new Error(`Failed to generate AI reply: ${error.message}`);
    }
  }
  
  /**
   * Generates a fallback reply when OpenAI API is unavailable
   */
  private generateFallbackReply(content: string, senderName: string): string {
    // Analyze the message content for some basic context
    const contentLower = content.toLowerCase();
    let replyTemplate = "";
    
    // Simple message categorization based on keywords
    if (contentLower.includes("question") || contentLower.includes("help") || 
        contentLower.includes("how do") || contentLower.includes("what is") || 
        contentLower.includes("?")) {
      replyTemplate = `Hey ${senderName}, thanks for your question! I'll get back to you with a more detailed response soon. In the meantime, feel free to check out my recent content which might address similar topics.`;
    } else if (contentLower.includes("love") || contentLower.includes("awesome") || 
               contentLower.includes("great") || contentLower.includes("amazing") ||
               contentLower.includes("good")) {
      replyTemplate = `Thanks so much for your kind words, ${senderName}! I really appreciate your support and I'm glad you're enjoying my content. Stay tuned for more coming soon!`;
    } else if (contentLower.includes("collab") || contentLower.includes("business") || 
               contentLower.includes("work together") || contentLower.includes("partner") ||
               contentLower.includes("opportunity")) {
      replyTemplate = `Hi ${senderName}, thanks for reaching out about collaboration! I'm always interested in exploring new opportunities. Let me review the details and I'll get back to you soon with more thoughts on how we might work together.`;
    } else {
      replyTemplate = `Hey ${senderName}, thanks for your message! I appreciate you reaching out. I'll get back to you soon with a more personalized response.`;
    }
    
    return replyTemplate;
  }

  /**
   * Classifies the intent of a message to identify high-intent leads
   */
  async classifyIntent(text: string): Promise<ClassifyIntentResult> {
    try {
      const client = await this.getClient();
      if (!client) {
        if (process.env.DEBUG_AI) console.debug('[DEBUG-AI] classifyIntent fallback');
        return { isHighIntent: false, confidence: 0, category: 'general_inquiry' };
      }
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
      `;

      const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return {
        isHighIntent: result.isHighIntent || false,
        confidence: Math.max(0, Math.min(1, result.confidence || 0)),
        category: result.category || "general_inquiry"
      };
    } catch (error: any) {
      console.error("Error classifying message intent:", error.message);
      // Return default values in case of error
      return {
        isHighIntent: false,
        confidence: 0,
        category: "general_inquiry"
      };
    }
  }

  /**
   * Detects sensitive content in messages that might require human review
   */
  async detectSensitiveContent(text: string): Promise<DetectSensitiveResult> {
    try {
      const client = await this.getClient();
      if (!client) {
        if (process.env.DEBUG_AI) console.debug('[DEBUG-AI] detectSensitive fallback');
        return { isSensitive: false, confidence: 0, category: 'not_sensitive' };
      }
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
      `;

      const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return {
        isSensitive: result.isSensitive || false,
        confidence: Math.max(0, Math.min(1, result.confidence || 0)),
        category: result.category || "not_sensitive"
      };
    } catch (error: any) {
      console.error("Error detecting sensitive content:", error.message);
      // Return default values in case of error
      return {
        isSensitive: false,
        confidence: 0,
        category: "not_sensitive"
      };
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
      const matchedRules = rules.filter(rule => {
        if (!rule.enabled) return false;
        
        // Simple keyword matching
        if (rule.triggerType === "keywords" && rule.triggerKeywords && rule.triggerKeywords.length > 0) {
          const lowerText = text.toLowerCase();
          return rule.triggerKeywords.some((keyword: string) => 
            lowerText.includes(keyword.toLowerCase())
          );
        }
        
        return false;
      });
      
      return matchedRules;
    } catch (error: any) {
      console.error("Error matching automation rules:", error.message);
      return [];
    }
  }
}

export const aiService = new AIService();
