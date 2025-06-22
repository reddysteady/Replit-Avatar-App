
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
      // Filter by userId and apply limit
      return this.chatLogs
        .filter(log => log.userId === userId)
        .slice(-limit)
        .reverse() // Most recent first
    } catch (error) {
      console.error('Failed to retrieve chat history:', error)
      return []
    }
  }

  async getSessionHistory(sessionId: string): Promise<ChatLogEntry[]> {
    try {
      return this.chatLogs
        .filter(log => log.sessionId === sessionId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    } catch (error) {
      console.error('Failed to retrieve session history:', error)
      return []
    }
  }

  private chatLogs: ChatLogEntry[] = []

  private async saveToDB(entry: ChatLogEntry): Promise<void> {
    try {
      // For MVP, store in memory with auto-incrementing ID
      const logEntry: ChatLogEntry = {
        ...entry,
        id: this.chatLogs.length + 1
      }
      
      this.chatLogs.push(logEntry)
      
      // Keep only last 1000 entries to prevent memory bloat
      if (this.chatLogs.length > 1000) {
        this.chatLogs = this.chatLogs.slice(-1000)
      }
    } catch (error) {
      console.warn('Chat log storage failed:', error)
    }
  }
}

export const chatLogger = new ChatLogger()
