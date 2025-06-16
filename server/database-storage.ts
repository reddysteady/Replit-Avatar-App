// See CHANGELOG.md for 2025-06-11 [Added]
// See CHANGELOG.md for 2025-06-13 [Added]
// See CHANGELOG.md for 2025-06-14 [Added]
// See CHANGELOG.md for 2025-06-12 [Fixed]
// See CHANGELOG.md for 2025-06-13 [Added-2]
import { 
  messages, 
  users, 
  settings, 
  automationRules, 
  leads, 
  analytics,
  messageThreads,
  contentItems,
  type User,
  type InsertUser,
  type Message,
  type InsertMessage,
  type Settings,
  type InsertSettings,
  type AutomationRule,
  type InsertAutomationRule,
  type Lead,
  type InsertLead,
  type Analytics,
  type InsertAnalytics,
  type MessageType,
  type SenderType,
  type MessageThread,
  type InsertMessageThread,
  type ThreadType,
  type InsertContentItem,
  type ContentItem
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { IStorage } from "./storage";
import { log } from "./logger";

export class DatabaseStorage implements IStorage {
  // Thread methods for conversation continuity
  async getThread(id: number): Promise<MessageThread | undefined> {
    const [thread] = await db.select().from(messageThreads).where(eq(messageThreads.id, id));
    return thread;
  }

  async getThreads(userId: number, source?: string): Promise<ThreadType[]> {
    let query = db
      .select()
      .from(messageThreads)
      .where(eq(messageThreads.userId, userId));

    if (source) {
      query = db
        .select()
        .from(messageThreads)
        .where(
          and(eq(messageThreads.userId, userId), eq(messageThreads.source, source))
        );
    }

    // Order by most recent message
    const threads = await query.orderBy(desc(messageThreads.lastMessageAt));

    if (threads.length === 0) return [];

    const intentRows = await db
      .select({
        threadId: messages.threadId,
        highIntent: sql<boolean>`bool_or(${messages.isHighIntent})`
      })
      .from(messages)
      .where(inArray(messages.threadId, threads.map(t => t.id)))
      .groupBy(messages.threadId);

    const intentMap = new Map<number, boolean>(
      intentRows.map(r => [r.threadId!, Boolean(r.highIntent)])
    );

    // Map to ThreadType
    return threads.map(thread => ({
      id: thread.id,
      externalParticipantId: thread.externalParticipantId,
      participantName: thread.participantName,
      participantAvatar: thread.participantAvatar || undefined,
      source: thread.source as 'instagram' | 'youtube',
      lastMessageAt: thread.lastMessageAt.toISOString(),
      lastMessageContent: thread.lastMessageContent || undefined,
      status: thread.status as 'active' | 'archived' | 'snoozed',
      unreadCount: thread.unreadCount || 0,
      autoReply: thread.autoReply ?? false,
      isHighIntent: intentMap.get(thread.id) ?? false
    }));
  }

  async getThreadMessages(threadId: number): Promise<MessageType[]> {
    log(`Fetching thread messages for thread ID ${threadId}`);

    // Get ALL messages for the thread, including threaded conversations
    const threadMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(messages.timestamp);

    log(`Found ${threadMessages.length} messages for thread ID ${threadId}`);

    // Log message details for debugging
    const messageDetails = threadMessages.map(m => ({
      id: m.id,
      content: (m.content || '').substring(0, 30),
      parentId: m.parentMessageId, 
      threadId: m.threadId,
      timestamp: m.timestamp
    }));

    log(`Thread messages with details: ${JSON.stringify(messageDetails)}`);

    // Build parent-child relationships for debugging
    const parentChildMap = new Map();
    threadMessages.forEach(msg => {
      if (msg.parentMessageId) {
        if (!parentChildMap.has(msg.parentMessageId)) {
          parentChildMap.set(msg.parentMessageId, []);
        }
        parentChildMap.get(msg.parentMessageId).push(msg.id);
      }
    });

    // Convert to a regular object for console logging
    const parentChildObj: Record<number, number[]> = {};
    parentChildMap.forEach((children, parentId) => {
      parentChildObj[parentId] = children;
    });

    log(`Parent-child relationships: ${JSON.stringify(parentChildObj)}`);

    // Map database messages to MessageType with proper parent-child relationships
    const mappedMessages = threadMessages.map(msg => {
      // Ensure content is never undefined/null
      if (!msg.content) {
        msg.content = `Message from ${msg.isOutbound ? 'You' : (msg.senderName || 'User')}`;
      }

      // Map to MessageType with correct parent-child relationship
      return this.mapMessageToMessageType(msg);
    });

    return mappedMessages;
  }

  async createThread(thread: InsertMessageThread): Promise<MessageThread> {
    const [newThread] = await db
      .insert(messageThreads)
      .values(thread)
      .returning();

    return newThread;
  }

  async updateThread(id: number, updates: Partial<MessageThread>): Promise<MessageThread | undefined> {
    const [updatedThread] = await db
      .update(messageThreads)
      .set({
        ...updates
      })
      .where(eq(messageThreads.id, id))
      .returning();

    return updatedThread;
  }

  async findOrCreateThreadByParticipant(
    userId: number, 
    externalParticipantId: string, 
    participantName: string, 
    source: string,
    participantAvatar?: string
  ): Promise<MessageThread> {
    // Try to find existing thread
    const [existingThread] = await db
      .select()
      .from(messageThreads)
      .where(
        and(
          eq(messageThreads.userId, userId),
          eq(messageThreads.externalParticipantId, externalParticipantId),
          eq(messageThreads.source, source)
        )
      );

    if (existingThread) {
      return existingThread;
    }

    // Create new thread if one doesn't exist
    const [newThread] = await db
      .insert(messageThreads)
      .values({
        userId,
        externalParticipantId,
        participantName,
        participantAvatar: participantAvatar || null,
        source,
        lastMessageAt: new Date(),
        status: 'active',
        unreadCount: 0,
        metadata: {}
      })
      .returning();

    return newThread;
  }

  async addMessageToThread(threadId: number, messageData: Omit<InsertMessage, 'threadId' | 'id'>): Promise<Message> {
    // Ensure we don't pass an 'id' field to let the database auto-generate it
    const { id, ...cleanMessageData } = messageData as any;

    const [newMessage] = await db
      .insert(messages)
      .values({ ...cleanMessageData, threadId })
      .returning();

    // Get the thread first to properly update unread count
    const thread = await this.getThread(threadId);
    if (thread) {
      // Update thread's last message information
      await this.updateThread(threadId, {
        lastMessageAt: new Date(),
        lastMessageContent: messageData.content,
        // Increment unread count if it's an inbound message
        unreadCount: messageData.isOutbound ? thread.unreadCount : (thread.unreadCount || 0) + 1
      });
    }

    return newMessage;
  }

  async markThreadAsRead(threadId: number): Promise<boolean> {
    try {
      await db
        .update(messageThreads)
        .set({
          unreadCount: 0,
        })
        .where(eq(messageThreads.id, threadId));

      return true;
    } catch (error) {
      console.error("Error marking thread as read:", error);
      return false;
    }
  }

  async deleteMessage(id: number): Promise<boolean> {
    await db.delete(messages).where(eq(messages.id, id));
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message === undefined;
  }

  async deleteThread(id: number): Promise<boolean> {
    await db.delete(messages).where(eq(messages.threadId, id));
    await db.delete(messageThreads).where(eq(messageThreads.id, id));
    const [thread] = await db.select().from(messageThreads).where(eq(messageThreads.id, id));
    return thread === undefined;
  }

  // Content methods for RAG pipeline
  async createContentItem(contentItem: InsertContentItem): Promise<ContentItem> {
    const [item] = await db
      .insert(contentItems)
      .values(contentItem)
      .returning();

    return item;
  }

  async findSimilarContent(userId: number, embedding: number[], limit: number): Promise<string[]> {
    try {
      const vector = `[${embedding.join(',')}]`;
      const results = await db.execute(sql`
        SELECT content
        FROM content_items
        WHERE user_id = ${userId}
        ORDER BY embedding <-> ${sql.raw(vector)}
        LIMIT ${limit}
      `);
      return results.rows.map(r => r.content as string);
    } catch (error) {
      console.error('Error finding similar content:', error);
      return [];
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getInstagramMessages(): Promise<MessageType[]> {
    const instagramMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.source, "instagram"))
      .orderBy(desc(messages.timestamp));

    return instagramMessages.map(msg => this.mapMessageToMessageType(msg));
  }

  async getYoutubeMessages(): Promise<MessageType[]> {
    const youtubeMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.source, "youtube"))
      .orderBy(desc(messages.timestamp));

    return youtubeMessages.map(msg => this.mapMessageToMessageType(msg));
  }

  private mapMessageToMessageType(msg: Message): MessageType {
    const sender: SenderType = {
      id: msg.senderId,
      name: msg.senderName,
      avatar: msg.senderAvatar || undefined
    };

    // Process the parentMessageId carefully to properly establish threads
    // Must be a number (not a string) for the React component to handle it correctly
    let parentId = undefined;

    if (msg.parentMessageId !== undefined && msg.parentMessageId !== null) {
      parentId = Number(msg.parentMessageId);
      log(`Converting parentMessageId for message ${msg.id}: ${msg.parentMessageId} -> ${parentId}`);

      // Check if it's a valid number after conversion
      if (isNaN(parentId)) {
        parentId = undefined;
        log(`Invalid parentMessageId for message ${msg.id}, setting to undefined`);
      }
    }

    // Map to the MessageType format with consistent types
    return {
      id: msg.id,
      source: msg.source as 'instagram' | 'youtube',
      content: msg.content,
      sender,
      timestamp: msg.timestamp.toISOString(),
      status: msg.status as 'new' | 'replied' | 'auto-replied',
      isHighIntent: msg.isHighIntent || false,
      reply: msg.reply || undefined,
        threadId: msg.threadId ?? undefined,
      parentMessageId: parentId,
      isOutbound: msg.isOutbound || false,
      isAiGenerated: msg.isAiGenerated || false,
      isAutoReply: msg.status === 'auto-replied'
    };
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    if (process.env.DEBUG_AI) {
      log(`[DEBUG-AI] inserting message ${JSON.stringify(message)}`);
    }

    const [newMessage] = await db.insert(messages).values(message).returning();

    if (process.env.DEBUG_AI) {
      log(`[DEBUG-AI] inserted message ${newMessage.id}`);
    }

    return newMessage;
  }

  async updateMessageStatus(
    id: number, 
    status: string, 
    reply: string, 
    isAiGenerated: boolean
  ): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set({
        status,
        reply,
        isAiGenerated,
        replyTimestamp: new Date()
      })
      .where(eq(messages.id, id))
      .returning();

    if (!updatedMessage) {
      throw new Error(`Message with ID ${id} not found`);
    }

    return updatedMessage;
  }

  // Settings methods
  async getSettings(userId: number): Promise<Settings> {
    const [existingSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId));

    if (existingSettings) {
      return existingSettings as Settings;
    }

    // Create default settings with JSON fields if not found
    const defaultSettings: InsertSettings = {
      userId,
      // JSON fields
      apiKeys: {
        instagram: "",
        instagramAppId: "",
        instagramAppSecret: "",
        instagramUserId: "",
        instagramPageId: "",
        instagramWebhookUrl: "",
        youtube: "",
        openai: process.env.OPENAI_API_KEY || "",
        airtable: "",
        airtableBaseId: "",
        airtableTableName: "Leads"
      },
      aiSettings: {
        temperature: 0.7,
        creatorToneDescription: "Friendly, helpful, and professional. I use emojis occasionally and aim to provide valuable information in a conversational tone.",
        maxResponseLength: 500,
        model: "gpt-4o",
        autoReplyInstagram: false,
        autoReplyYoutube: false,
        flexProcessing: false,
        responseDelay: 0
      },
      notificationSettings: {
        email: "",
        notifyOnHighIntent: true,
        notifyOnSensitiveTopics: true
      },

      // Legacy fields (for backward compatibility)
      aiAutoRepliesInstagram: false,
      aiAutoRepliesYoutube: false,
      instagramToken: "",
      youtubeToken: "",
      openaiToken: process.env.OPENAI_API_KEY || "",
      airtableToken: "",
      airtableBaseId: "",
      airtableTableName: "Leads",
      creatorToneDescription: "Friendly, helpful, and professional. I use emojis occasionally and aim to provide valuable information in a conversational tone.",
      aiTemperature: 70, // 0.7
      aiModel: "gpt-4o",
      maxResponseLength: 500,
      notificationEmail: "",
      notifyOnHighIntent: true,
      notifyOnSensitiveTopics: true
    };

      const [newSettings] = await db.insert(settings).values(defaultSettings).returning();
      return newSettings as Settings;
  }

  async updateSettings(userId: number, updates: Partial<Settings>): Promise<Settings> {
    const existingSettings = await this.getSettings(userId);

    const [updatedSettings] = await db
      .update(settings)
      .set(updates)
      .where(eq(settings.id, existingSettings.id))
      .returning();

    return updatedSettings as Settings;
  }

  // Automation rules methods
  async getAutomationRules(userId: number): Promise<AutomationRule[]> {
    return db
      .select()
      .from(automationRules)
      .where(eq(automationRules.userId, userId))
      .orderBy(desc(automationRules.createdAt));
  }

  async getAutomationRule(id: number): Promise<AutomationRule | undefined> {
    const [rule] = await db
      .select()
      .from(automationRules)
      .where(eq(automationRules.id, id));

    return rule;
  }

  async createAutomationRule(rule: InsertAutomationRule): Promise<AutomationRule> {
    const [newRule] = await db
      .insert(automationRules)
      .values(rule)
      .returning();

    return newRule;
  }

  async updateAutomationRule(id: number, updates: Partial<AutomationRule>): Promise<AutomationRule | undefined> {
    const [updatedRule] = await db
      .update(automationRules)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(automationRules.id, id))
      .returning();

    return updatedRule;
  }

  async deleteAutomationRule(id: number): Promise<boolean> {
    await db
      .delete(automationRules)
      .where(eq(automationRules.id, id));

    // Check if the rule still exists to determine success
    const rule = await this.getAutomationRule(id);
    return rule === undefined;
  }

  // Lead methods
  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, id));

    return lead;
  }

  async getLeadsByUserId(userId: number): Promise<Lead[]> {
    return db
      .select()
      .from(leads)
      .where(eq(leads.userId, userId))
      .orderBy(desc(leads.createdAt));
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db
      .insert(leads)
      .values(lead)
      .returning();

    return newLead;
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    const [updatedLead] = await db
      .update(leads)
      .set(updates)
      .where(eq(leads.id, id))
      .returning();

    return updatedLead;
  }

  // Analytics methods
  async getAnalytics(userId: number): Promise<Analytics> {
    const [existingAnalytics] = await db
      .select()
      .from(analytics)
      .where(eq(analytics.userId, userId));

    if (existingAnalytics) {
      return existingAnalytics;
    }

    // Create default analytics if not found
    const defaultAnalytics: InsertAnalytics = {
      userId,
      date: new Date(),
      instagramMsgCount: 0,
      youtubeMsgCount: 0,
      newMsgCount: 0,
      repliedMsgCount: 0,
      autoRepliedMsgCount: 0,
      avgResponseTimeMinutes: 0,
      highIntentLeadsCount: 0,
      topTopics: [
        { name: "Pricing", count: 0 },
        { name: "Features", count: 0 },
        { name: "Support", count: 0 },
        { name: "Collaboration", count: 0 },
        { name: "Feedback", count: 0 }
      ],
      sensitiveTopicsCount: 0
    };

    const [newAnalytics] = await db
      .insert(analytics)
      .values(defaultAnalytics)
      .returning();

    return newAnalytics;
  }

  async updateAnalytics(userId: number, updates: Partial<Analytics>): Promise<Analytics> {
    const existingAnalytics = await this.getAnalytics(userId);

    const [updatedAnalytics] = await db
      .update(analytics)
      .set(updates)
      .where(eq(analytics.id, existingAnalytics.id))
      .returning();

    return updatedAnalytics;
  }
}