// See CHANGELOG.md for 2025-06-11 [Added]
// [Fixed] 2025-06-09 - add in-memory thread support for conversation threads
import {
  messages, 
  users, 
  settings, 
  automationRules, 
  leads, 
  analytics,
  messageThreads,
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
  type ContentItem
} from "@shared/schema";

// Extend storage interface with necessary methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  getInstagramMessages(): Promise<MessageType[]>;
  getYoutubeMessages(): Promise<MessageType[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessageStatus(id: number, status: string, reply: string, isAiGenerated: boolean): Promise<Message>;

  // Settings methods
  getSettings(userId: number): Promise<Settings>;
  updateSettings(userId: number, updates: Partial<Settings>): Promise<Settings>;

  // Automation rules methods
  getAutomationRules(userId: number): Promise<AutomationRule[]>;
  getAutomationRule(id: number): Promise<AutomationRule | undefined>;
  createAutomationRule(rule: InsertAutomationRule): Promise<AutomationRule>;
  updateAutomationRule(id: number, updates: Partial<AutomationRule>): Promise<AutomationRule | undefined>;
  deleteAutomationRule(id: number): Promise<boolean>;

  // Lead methods
  getLead(id: number): Promise<Lead | undefined>;
  getLeadsByUserId(userId: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined>;

  // Analytics methods
  getAnalytics(userId: number): Promise<Analytics>;
  updateAnalytics(userId: number, updates: Partial<Analytics>): Promise<Analytics>;
  
  // Content methods for RAG pipeline
  createContentItem(contentItem: any): Promise<any>;
  findSimilarContent(userId: number, embedding: number[], limit: number): Promise<string[]>;
  
  // Thread methods for conversation continuity
  getThread(id: number): Promise<MessageThread | undefined>;
  getThreads(userId: number, source?: string): Promise<ThreadType[]>;
  getThreadMessages(threadId: number): Promise<MessageType[]>;
  createThread(thread: InsertMessageThread): Promise<MessageThread>;
  updateThread(id: number, updates: Partial<MessageThread>): Promise<MessageThread | undefined>;
  findOrCreateThreadByParticipant(
    userId: number, 
    externalParticipantId: string, 
    participantName: string, 
    source: string,
    participantAvatar?: string
  ): Promise<MessageThread>;
  addMessageToThread(threadId: number, message: InsertMessage): Promise<Message>;
  markThreadAsRead(threadId: number): Promise<boolean>;
}

export class MemStorage {
  private users: Map<number, User>;
  private msgs: Map<number, Message>;
  private settingsMap: Map<number, Settings>;
  private rules: Map<number, AutomationRule>;
  private leadsMap: Map<number, Lead>;
  private analyticsMap: Map<number, Analytics>;
  private contentItems: Map<number, ContentItem>;
  private threads: Map<number, MessageThread>;

  private userId: number;
  private messageId: number;
  private threadId: number;
  private settingsId: number;
  private ruleId: number;
  private leadId: number;
  private analyticsId: number;

  constructor() {
    this.users = new Map();
    this.msgs = new Map();
    this.settingsMap = new Map();
    this.rules = new Map();
    this.leadsMap = new Map();
    this.analyticsMap = new Map();
    this.contentItems = new Map();
    this.threads = new Map();
    
    this.userId = 1;
    this.messageId = 1;
    this.threadId = 1;
    this.settingsId = 1;
    this.ruleId = 1;
    this.leadId = 1;
    this.analyticsId = 1;
    
    // Initialize with sample data for MVP
    this.initializeSampleData();
  }

  // Initialize sample data for MVP demonstration
  private initializeSampleData() {
    // Create default user
    const defaultUser: User = {
      id: 1,
      username: "demo_user",
      password: "password123", // In a real app, this would be hashed
      email: "demo@example.com",
      createdAt: new Date()
    };
    this.users.set(1, defaultUser);

    // Create default settings
    const defaultSettings: Settings = {
      id: 1,
      userId: 1,
      apiKeys: {},
      aiSettings: {},
      notificationSettings: {},
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
      notificationEmail: "demo@example.com",
      notifyOnHighIntent: true,
      notifyOnSensitiveTopics: true
    };
    this.settingsMap.set(1, defaultSettings);

    // Create default analytics
    const defaultAnalytics: Analytics = {
      id: 1,
      userId: 1,
      date: new Date(),
      instagramMsgCount: 10,
      youtubeMsgCount: 5,
      newMsgCount: 3,
      repliedMsgCount: 8,
      autoRepliedMsgCount: 4,
      avgResponseTimeMinutes: 15,
      highIntentLeadsCount: 2,
      topTopics: [
        { name: "Pricing", count: 12 },
        { name: "Features", count: 9 },
        { name: "Support", count: 7 },
        { name: "Collaboration", count: 5 },
        { name: "Feedback", count: 4 }
      ],
      sensitiveTopicsCount: 1
    };
    this.analyticsMap.set(1, defaultAnalytics);

    // Add sample messages
    const sampleMessages: InsertMessage[] = [
      {
        source: "instagram",
        externalId: "ig-123456",
        senderId: "user1",
        senderName: "Michael Scott",
        senderAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256",
        content: "Hey, I love your content about productivity systems! I've been struggling with managing my time. Do you offer coaching or any personalized advice?",
        timestamp: new Date(),
        status: "new",
        isHighIntent: true,
        intentCategory: "service_inquiry",
        intentConfidence: 80,
        userId: 1
      },
      {
        source: "instagram",
        externalId: "ig-123457",
        senderId: "user2",
        senderName: "Jane Cooper",
        senderAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256",
        content: "I just watched your latest video and I have a question about the app you mentioned. What was the name again? Thanks!",
        timestamp: new Date(),
        status: "new",
        isHighIntent: false,
        userId: 1
      },
      {
        source: "instagram",
        externalId: "ig-123458",
        senderId: "user3",
        senderName: "Tom Wilson",
        senderAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256",
        content: "Love your content! What camera do you use for your videos?",
        timestamp: new Date(Date.now() - 86400000), // Yesterday
        status: "auto-replied",
        reply: "Thanks for the kind words! I use a Sony A7III for most of my videos with a 24-70mm lens. I have all my gear linked in the description of my latest video if you want to check it out. Let me know if you have any other questions!",
        isAiGenerated: true,
        userId: 1
      },
      {
        source: "instagram",
        externalId: "ig-123459",
        senderId: "user4",
        senderName: "Alex Morgan",
        senderAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256",
        content: "Could you do a tutorial on how to set up that productivity dashboard you showed last week?",
        timestamp: new Date(Date.now() - 86400000), // Yesterday
        status: "replied",
        reply: "Hey Alex! I'm actually planning to release a tutorial next week. I'll send you the link when it's ready!",
        isAiGenerated: false,
        userId: 1
      },
      {
        source: "instagram",
        externalId: "ig-123460",
        senderId: "user5",
        senderName: "Chris Johnson",
        senderAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256",
        content: "I'm looking to hire someone with your expertise for my company's next project. Can we discuss potential collaboration opportunities?",
        timestamp: new Date(),
        status: "new",
        isHighIntent: true,
        intentCategory: "business_opportunity",
        intentConfidence: 90,
        userId: 1
      },
      {
        source: "youtube",
        externalId: "yt-123456",
        senderId: "ytuser1",
        senderName: "Sarah Williams",
        senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256",
        content: "Great video! Do you have any tips for beginners in this field?",
        timestamp: new Date(),
        status: "new",
        userId: 1
      },
      {
        source: "youtube",
        externalId: "yt-123457",
        senderId: "ytuser2",
        senderName: "Mark Thompson",
        senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256",
        content: "I've been following your channel for months and I've learned so much. Would you consider doing a collaboration?",
        timestamp: new Date(),
        status: "new",
        isHighIntent: true,
        intentCategory: "collaboration",
        intentConfidence: 85,
        userId: 1
      }
    ];

    const threadLookup = new Map<string, number>();
    sampleMessages.forEach(msg => {
      const key = `${msg.senderId}-${msg.source}`;
      let tId = threadLookup.get(key);
      if (!tId) {
        const newThread: MessageThread = {
          id: this.threadId++,
          userId: msg.userId,
          externalParticipantId: msg.senderId,
          participantName: msg.senderName,
          participantAvatar: msg.senderAvatar ?? null,
          source: msg.source as 'instagram' | 'youtube',
          lastMessageAt: msg.timestamp,
          lastMessageContent: msg.content,
          status: 'active',
          unreadCount: msg.isOutbound ? 0 : 1,
          createdAt: new Date(),
          metadata: {}
        } as MessageThread;
        this.threads.set(newThread.id, newThread);
        threadLookup.set(key, newThread.id);
        tId = newThread.id;
      } else {
        const existing = this.threads.get(tId)!;
        const msgTime = msg.timestamp ?? new Date();
        if (existing.lastMessageAt < msgTime) {
          existing.lastMessageAt = msgTime;
          existing.lastMessageContent = msg.content;
        }
        if (!msg.isOutbound) {
          existing.unreadCount = (existing.unreadCount ?? 0) + 1;
        }
        this.threads.set(tId, existing);
      }

      const message: Message = {
        ...msg,
        id: this.messageId++,
        threadId: tId,
        timestamp: msg.timestamp ?? new Date()
      } as Message;
      this.msgs.set(message.id, message);
    });

    // Add sample automation rules
    const sampleRules: InsertAutomationRule[] = [
      {
        userId: 1,
        name: "Reply to camera questions",
        enabled: true,
        triggerType: "keywords",
        triggerKeywords: ["camera", "gear", "lens", "equipment", "filming"],
        action: "auto_reply",
        responseTemplate: "Thanks for your interest in my gear! I use a Sony A7III with a 24-70mm lens for most of my videos. I also use the Rode VideoMic Pro+ for audio. You can find links to all my equipment in the description of my latest video."
      },
      {
        userId: 1,
        name: "Route collaboration requests to me",
        enabled: true,
        triggerType: "keywords",
        triggerKeywords: ["collab", "collaboration", "partner", "together", "joint"],
        action: "route_human"
      },
      {
        userId: 1,
        name: "Add business inquiries to Airtable",
        enabled: true,
        triggerType: "keywords",
        triggerKeywords: ["hire", "job", "project", "work", "business", "client"],
        action: "add_airtable"
      }
    ];

      sampleRules.forEach(rule => {
        const automationRule: AutomationRule = {
          ...rule,
          id: this.ruleId++,
          createdAt: new Date(),
          updatedAt: new Date()
        } as AutomationRule;
        this.rules.set(automationRule.id, automationRule);
      });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.msgs.get(id);
  }

  async getInstagramMessages(): Promise<MessageType[]> {
    const instagramMessages = Array.from(this.msgs.values())
      .filter(msg => msg.source === "instagram")
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .map(msg => this.mapMessageToMessageType(msg));
    
    return instagramMessages;
  }

  async getYoutubeMessages(): Promise<MessageType[]> {
    const youtubeMessages = Array.from(this.msgs.values())
      .filter(msg => msg.source === "youtube")
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .map(msg => this.mapMessageToMessageType(msg));
    
    return youtubeMessages;
  }

  private mapMessageToMessageType(msg: Message): MessageType {
    const sender: SenderType = {
      id: msg.senderId,
      name: msg.senderName,
      avatar: msg.senderAvatar ?? undefined
    };

    // Normalize parent ID to avoid threading issues when running without the
    // database. Missing parentMessageId was causing replies to render as
    // top-level messages. Ref: [Fixed] 2025-06-08 in CHANGELOG.md
    let parentId: number | undefined = undefined;
    if (msg.parentMessageId !== undefined && msg.parentMessageId !== null) {
      const numeric = Number(msg.parentMessageId);
      if (!Number.isNaN(numeric)) {
        parentId = numeric;
      }
    }

    return {
      id: msg.id,
      source: msg.source as 'instagram' | 'youtube',
      content: msg.content,
      sender,
      timestamp: msg.timestamp.toISOString(),
      status: msg.status as 'new' | 'replied' | 'auto-replied',
      isHighIntent: msg.isHighIntent || false,
      reply: msg.reply ?? undefined,
      threadId: msg.threadId ?? undefined,
      parentMessageId: parentId,
      isOutbound: msg.isOutbound || false,
      isAiGenerated: msg.isAiGenerated ?? false
    };
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const newMessage: Message = { ...message, id } as Message;
    this.msgs.set(id, newMessage);
    return newMessage;
  }

  async updateMessageStatus(
    id: number,
    status: string,
    reply: string,
    isAiGenerated: boolean
  ): Promise<Message> {
    const message = this.msgs.get(id);
    if (!message) {
      throw new Error(`Message with ID ${id} not found`);
    }

    const updatedMessage: Message = {
      ...message,
      status,
      reply,
      isAiGenerated,
      replyTimestamp: new Date()
    };

    this.msgs.set(id, updatedMessage);
    return updatedMessage;
  }

  // Thread methods for conversation continuity
  async getThread(id: number): Promise<MessageThread | undefined> {
    return this.threads.get(id);
  }

  async getThreads(userId: number, source?: string): Promise<ThreadType[]> {
    const threads = Array.from(this.threads.values()).filter(
      t => t.userId === userId && (!source || t.source === source)
    ).sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

    return threads.map(t => ({
      id: t.id,
      externalParticipantId: t.externalParticipantId,
      participantName: t.participantName,
      participantAvatar: t.participantAvatar || undefined,
      source: t.source as 'instagram' | 'youtube',
      lastMessageAt: t.lastMessageAt.toISOString(),
      lastMessageContent: t.lastMessageContent || undefined,
      status: t.status as 'active' | 'archived' | 'snoozed',
      unreadCount: t.unreadCount || 0
    }));
  }

  async getThreadMessages(threadId: number): Promise<MessageType[]> {
    return Array.from(this.msgs.values())
      .filter(m => m.threadId === threadId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(m => this.mapMessageToMessageType(m));
  }

  async createThread(thread: InsertMessageThread): Promise<MessageThread> {
    const id = this.threadId++;
    const now = new Date();
    const newThread: MessageThread = {
      ...thread,
      id,
      createdAt: now,
      lastMessageAt: now,
      unreadCount: 0
    } as MessageThread;
    this.threads.set(id, newThread);
    return newThread;
  }

  async updateThread(id: number, updates: Partial<MessageThread>): Promise<MessageThread | undefined> {
    const thread = this.threads.get(id);
    if (!thread) return undefined;
    const updated = { ...thread, ...updates } as MessageThread;
    this.threads.set(id, updated);
    return updated;
  }

  async findOrCreateThreadByParticipant(
    userId: number,
    externalParticipantId: string,
    participantName: string,
    source: string,
    participantAvatar?: string
  ): Promise<MessageThread> {
    const existing = Array.from(this.threads.values()).find(
      t => t.userId === userId &&
        t.externalParticipantId === externalParticipantId &&
        t.source === source
    );
    if (existing) return existing;
    return this.createThread({
      userId,
      externalParticipantId,
      participantName,
      participantAvatar: participantAvatar || null,
      source,
      metadata: {}
    } as InsertMessageThread);
  }

  async addMessageToThread(threadId: number, message: InsertMessage): Promise<Message> {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread with ID ${threadId} not found`);
    }
    const id = this.messageId++;
    const now = message.timestamp ?? new Date();
    const newMessage: Message = { ...message, id, threadId, timestamp: now } as Message;
    this.msgs.set(id, newMessage);

    this.threads.set(threadId, {
      ...thread,
      lastMessageAt: now,
      lastMessageContent: message.content,
      unreadCount: message.isOutbound ? thread.unreadCount : (thread.unreadCount || 0) + 1
    });
    return newMessage;
  }

  async markThreadAsRead(threadId: number): Promise<boolean> {
    const thread = this.threads.get(threadId);
    if (!thread) return false;
    this.threads.set(threadId, { ...thread, unreadCount: 0 });
    return true;
  }

  async deleteMessage(id: number): Promise<boolean> {
    if (!this.msgs.has(id)) return false;
    this.msgs.delete(id);
    return true;
  }

  async deleteThread(id: number): Promise<boolean> {
    if (!this.threads.has(id)) return false;
    this.threads.delete(id);
    for (const [mid, msg] of Array.from(this.msgs.entries())) {
      if (msg.threadId === id) {
        this.msgs.delete(mid);
      }
    }
    return true;
  }

  // Settings methods
  async getSettings(userId: number): Promise<Settings> {
    let settings = this.settingsMap.get(userId);
    
    if (!settings) {
      // Create default settings if not found
      settings = {
        id: this.settingsId++,
        userId,
        apiKeys: {},
        aiSettings: {},
        notificationSettings: {},
        aiAutoRepliesInstagram: false,
        aiAutoRepliesYoutube: false,
        instagramToken: "",
        youtubeToken: "",
        openaiToken: process.env.OPENAI_API_KEY || "",
        airtableToken: "",
        airtableBaseId: "",
        airtableTableName: "Leads",
        creatorToneDescription: "",
        aiTemperature: 70, // 0.7
        aiModel: "gpt-4o",
        maxResponseLength: 500,
        notificationEmail: "",
        notifyOnHighIntent: true,
        notifyOnSensitiveTopics: true
      };
      
      this.settingsMap.set(userId, settings);
    }
    
    return settings;
  }

  async updateSettings(userId: number, updates: Partial<Settings>): Promise<Settings> {
    const settings = await this.getSettings(userId);
    
    const updatedSettings: Settings = {
      ...settings,
      ...updates
    };
    
    this.settingsMap.set(userId, updatedSettings);
    return updatedSettings;
  }

  // Automation rules methods
  async getAutomationRules(userId: number): Promise<AutomationRule[]> {
    return Array.from(this.rules.values())
      .filter(rule => rule.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAutomationRule(id: number): Promise<AutomationRule | undefined> {
    return this.rules.get(id);
  }

  async createAutomationRule(rule: InsertAutomationRule): Promise<AutomationRule> {
    const id = this.ruleId++;
    const now = new Date();

    const newRule: AutomationRule = {
      ...rule,
      id,
      createdAt: now,
      updatedAt: now
    } as AutomationRule;
    
    this.rules.set(id, newRule);
    return newRule;
  }

  async updateAutomationRule(id: number, updates: Partial<AutomationRule>): Promise<AutomationRule | undefined> {
    const rule = this.rules.get(id);
    if (!rule) {
      return undefined;
    }

    const updatedRule: AutomationRule = {
      ...rule,
      ...updates,
      updatedAt: new Date()
    } as AutomationRule;
    
    this.rules.set(id, updatedRule);
    return updatedRule;
  }

  async deleteAutomationRule(id: number): Promise<boolean> {
    if (!this.rules.has(id)) {
      return false;
    }
    
    return this.rules.delete(id);
  }

  // Lead methods
  async getLead(id: number): Promise<Lead | undefined> {
    return this.leadsMap.get(id);
  }

  async getLeadsByUserId(userId: number): Promise<Lead[]> {
    return Array.from(this.leadsMap.values())
      .filter(lead => lead.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const id = this.leadId++;
    
    const newLead: Lead = {
      ...lead,
      id,
      createdAt: new Date()
    } as Lead;
    
    this.leadsMap.set(id, newLead);
    return newLead;
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    const lead = this.leadsMap.get(id);
    if (!lead) {
      return undefined;
    }
    
    const updatedLead: Lead = {
      ...lead,
      ...updates
    } as Lead;
    
    this.leadsMap.set(id, updatedLead);
    return updatedLead;
  }

  // Analytics methods
  async getAnalytics(userId: number): Promise<Analytics> {
    let analytics = this.analyticsMap.get(userId);
    
    if (!analytics) {
      // Create default analytics if not found
      analytics = {
        id: this.analyticsId++,
        userId,
        date: new Date(),
        instagramMsgCount: 0,
        youtubeMsgCount: 0,
        newMsgCount: 0,
        repliedMsgCount: 0,
        autoRepliedMsgCount: 0,
        avgResponseTimeMinutes: 0,
        highIntentLeadsCount: 0,
        topTopics: [],
        sensitiveTopicsCount: 0
      };
      
      this.analyticsMap.set(userId, analytics);
    }
    
    return analytics;
  }

  async updateAnalytics(userId: number, updates: Partial<Analytics>): Promise<Analytics> {
    const analytics = await this.getAnalytics(userId);

    const updatedAnalytics: Analytics = {
      ...analytics,
      ...updates
    };

    this.analyticsMap.set(userId, updatedAnalytics);
    return updatedAnalytics;
  }

  // Content methods
  async createContentItem(contentItem: ContentItem): Promise<ContentItem> {
    const id = this.contentItems.size + 1;
    const item = { ...contentItem, id };
    this.contentItems.set(id, item);
    return item;
  }

  async findSimilarContent(
    _userId: number,
    _embedding: number[],
    _limit: number,
  ): Promise<string[]> {
    return [];
  }
}

import { DatabaseStorage } from "./database-storage";

// Use the DatabaseStorage implementation for persistent storage
export const storage = new DatabaseStorage();
