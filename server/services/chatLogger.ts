
import { storage } from '../storage'
import { log } from '../logger'

export interface ChatLogEntry {
  id?: number
  userId: number
  sessionId?: string
  messageType: 'user' | 'assistant' | 'system'
  content: string
  metadata?: {
    personaMode?: string
    stage?: string
    fieldsCollected?: number
    showChipSelector?: boolean
    extractedData?: any
    confidenceScore?: number
    fallbackUsed?: boolean
    errorRecovered?: boolean
    responseTime?: number
    [key: string]: any
  }
  timestamp: Date
}

export class ChatLogger {
  async logMessage(entry: ChatLogEntry): Promise<void> {
    try {
      // Store in database for persistence
      await this.saveToDB(entry)
      
      // Also log to console for immediate visibility
      const logLevel = entry.metadata?.fallbackUsed ? 'warn' : 'info'
      const metaStr = entry.metadata ? JSON.stringify(entry.metadata) : ''
      
      log(
        `[CHAT-LOG] ${entry.messageType.toUpperCase()}: "${entry.content.substring(0, 100)}..." ${metaStr}`,
        logLevel as any
      )
    } catch (error) {
      console.error('Failed to log chat message:', error)
    }
  }

  async logPersonalityExtraction(
    userId: number,
    userMessage: string,
    aiResponse: any,
    sessionId?: string,
    responseTime?: number
  ): Promise<void> {
    // Log user message
    await this.logMessage({
      userId,
      sessionId,
      messageType: 'user',
      content: userMessage,
      timestamp: new Date()
    })

    // Log AI response with metadata
    await this.logMessage({
      userId,
      sessionId,
      messageType: 'assistant',
      content: aiResponse.response || '',
      metadata: {
        personaMode: aiResponse.personaMode,
        stage: aiResponse.stage,
        fieldsCollected: aiResponse.fieldsCollected,
        showChipSelector: aiResponse.showChipSelector,
        extractedData: aiResponse.extractedData,
        confidenceScore: aiResponse.confidenceScore,
        fallbackUsed: aiResponse.fallbackUsed,
        errorRecovered: aiResponse.errorRecovered,
        responseTime
      },
      timestamp: new Date()
    })
  }

  async getChatHistory(userId: number, limit: number = 100): Promise<ChatLogEntry[]> {
    try {
      // For now, return from memory storage
      // In production, this would query the database
      return []
    } catch (error) {
      console.error('Failed to retrieve chat history:', error)
      return []
    }
  }

  async getSessionHistory(sessionId: string): Promise<ChatLogEntry[]> {
    try {
      // Implementation would depend on your storage solution
      return []
    } catch (error) {
      console.error('Failed to retrieve session history:', error)
      return []
    }
  }

  private async saveToDB(entry: ChatLogEntry): Promise<void> {
    // For MVP, we'll extend the existing storage interface
    // In production, you'd want a dedicated chat_logs table
    try {
      // This is a placeholder - you could extend storage.ts to handle chat logs
      // or implement file-based logging for now
      const logData = {
        timestamp: entry.timestamp.toISOString(),
        userId: entry.userId,
        sessionId: entry.sessionId,
        type: entry.messageType,
        content: entry.content,
        metadata: entry.metadata
      }
      
      // For now, just ensure it doesn't crash
      // You could implement file logging here if needed
    } catch (error) {
      // Fail silently to not disrupt the main flow
      console.warn('Chat log storage failed:', error)
    }
  }
}

export const chatLogger = new ChatLogger()
