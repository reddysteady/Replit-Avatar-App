// See CHANGELOG.md for 2025-06-12 [Added]
import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

// Type for JSON data
export type Json = Record<string, any>

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Message threads table
export const messageThreads = pgTable('message_threads', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  externalParticipantId: text('external_participant_id').notNull(), // ID of external person (e.g. Instagram follower)
  participantName: text('participant_name').notNull(), // Name of the person we're talking with
  participantAvatar: text('participant_avatar'),
  source: text('source').notNull(), // 'instagram' or 'youtube'
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  lastMessageContent: text('last_message_content'),
  status: text('status').default('active'), // 'active', 'archived', 'snoozed'
  autoReply: boolean('auto_reply').default(false),
  unreadCount: integer('unread_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  metadata: jsonb('metadata'),
})

// Messages table (shared between Instagram and YouTube)
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  threadId: integer('thread_id').references(() => messageThreads.id), // Link to thread
  source: text('source').notNull(), // 'instagram' or 'youtube'
  externalId: text('external_id').notNull(), // ID from external platform
  senderId: text('sender_id').notNull(), // ID of sender from external platform
  senderName: text('sender_name').notNull(),
  senderAvatar: text('sender_avatar'),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  status: text('status').notNull().default('new'), // 'new', 'replied', 'auto-replied'
  isHighIntent: boolean('is_high_intent').default(false),
  intentCategory: text('intent_category'),
  intentConfidence: integer('intent_confidence'),
  isSensitive: boolean('is_sensitive').default(false),
  sensitiveCategory: text('sensitive_category'),
  reply: text('reply'),
  replyTimestamp: timestamp('reply_timestamp'),
  isAiGenerated: boolean('is_ai_generated').default(false),
  isOutbound: boolean('is_outbound').default(false), // True if we sent it, false if we received it
  parentMessageId: integer('parent_message_id'), // For tracking direct replies to specific messages
  metadata: jsonb('metadata'),
  userId: integer('user_id').references(() => users.id),
})

// Settings table
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),

  // New JSON fields for settings
  apiKeys: jsonb('api_keys'),
  aiSettings: jsonb('ai_settings'),
  notificationSettings: jsonb('notification_settings'),
  personaConfig: jsonb('persona_config'),
  systemPrompt: text('system_prompt'),

  // Legacy fields (for backward compatibility)
  aiAutoRepliesInstagram: boolean('ai_auto_replies_instagram').default(false),
  aiAutoRepliesYoutube: boolean('ai_auto_replies_youtube').default(false),
  instagramToken: text('instagram_token'),
  youtubeToken: text('youtube_token'),
  openaiToken: text('openai_token'),
  airtableToken: text('airtable_token'),
  airtableBaseId: text('airtable_base_id'),
  airtableTableName: text('airtable_table_name'),
  creatorToneDescription: text('creator_tone_description'),
  aiTemperature: integer('ai_temperature').default(70), // stored as int (0.7 * 100)
  aiModel: text('ai_model').default('gpt-4o'),
  maxResponseLength: integer('max_response_length').default(500),
  notificationEmail: text('notification_email'),
  notifyOnHighIntent: boolean('notify_on_high_intent').default(true),
  notifyOnSensitiveTopics: boolean('notify_on_sensitive_topics').default(true),
})

// Automation rules
export const automationRules = pgTable('automation_rules', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  enabled: boolean('enabled').default(true),
  triggerType: text('trigger_type').notNull().default('keywords'), // 'keywords', 'intent', etc.
  triggerKeywords: jsonb('trigger_keywords').default([]),
  action: text('action').notNull(), // 'auto_reply', 'route_human', 'add_airtable'
  responseTemplate: text('response_template'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Lead captures
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  messageId: integer('message_id')
    .references(() => messages.id)
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  source: text('source').notNull(), // 'instagram' or 'youtube'
  intentCategory: text('intent_category'),
  contactInfo: text('contact_info'),
  notes: text('notes'),
  airtableRecordId: text('airtable_record_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  status: text('status').default('new'), // 'new', 'contacted', 'converted', etc.
})

// Analytics data
export const analytics = pgTable('analytics', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  date: timestamp('date').defaultNow().notNull(),
  instagramMsgCount: integer('instagram_msg_count').default(0),
  youtubeMsgCount: integer('youtube_msg_count').default(0),
  newMsgCount: integer('new_msg_count').default(0),
  repliedMsgCount: integer('replied_msg_count').default(0),
  autoRepliedMsgCount: integer('auto_replied_msg_count').default(0),
  avgResponseTimeMinutes: integer('avg_response_time_minutes').default(0),
  highIntentLeadsCount: integer('high_intent_leads_count').default(0),
  topTopics: jsonb('top_topics').default([]),
  sensitiveTopicsCount: integer('sensitive_topics_count').default(0),
})

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
})
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
})
export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
})
export const insertAutomationRuleSchema = createInsertSchema(
  automationRules,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
})
export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
})
export const insertMessageThreadSchema = createInsertSchema(
  messageThreads,
).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
})

// Content Items table (for RAG pipeline)
export const contentItems = pgTable(
  'content_items',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    externalId: text('external_id').notNull(),
    contentType: text('content_type').notNull(), // 'post', 'video', 'blog', etc.
    title: text('title').notNull(),
    content: text('content').notNull(),
    url: text('url').notNull(),
    engagementScore: integer('engagement_score').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    metadata: jsonb('metadata').default({}),
  },
  (table) => {
    return {
      userIdIdx: index('content_items_user_id_idx').on(table.userId),
      contentTypeIdx: index('content_items_content_type_idx').on(
        table.contentType,
      ),
      externalIdIdx: index('content_items_external_id_idx').on(
        table.externalId,
      ),
    }
  },
)

export const insertContentItemSchema = createInsertSchema(contentItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>
export type User = typeof users.$inferSelect

export type InsertMessage = z.infer<typeof insertMessageSchema>
export type Message = typeof messages.$inferSelect

export type InsertSettings = z.infer<typeof insertSettingsSchema>
export type Settings = typeof settings.$inferSelect & {
  apiKeys: Record<string, any>
  aiSettings: Record<string, any>
  notificationSettings: Record<string, any>
  personaConfig?: Record<string, any>
  systemPrompt?: string
}

export type InsertAutomationRule = z.infer<typeof insertAutomationRuleSchema>
export type AutomationRule = typeof automationRules.$inferSelect

export type InsertLead = z.infer<typeof insertLeadSchema>
export type Lead = typeof leads.$inferSelect

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>
export type Analytics = typeof analytics.$inferSelect

export type InsertContentItem = z.infer<typeof insertContentItemSchema>
export type ContentItem = typeof contentItems.$inferSelect & {
  embedding?: number[]
}
export type InsertMessageThread = z.infer<typeof insertMessageThreadSchema>
export type MessageThread = typeof messageThreads.$inferSelect

// Message types for frontend
export interface SenderType {
  id: string
  name: string
  avatar?: string
}

export interface MessageType {
  id: number
  threadId?: number
  source: 'instagram' | 'youtube'
  content: string
  sender: SenderType
  timestamp: string
  status: 'new' | 'replied' | 'auto-replied'
  isHighIntent: boolean
  reply?: string
  isAiGenerated?: boolean
  isOutbound?: boolean
  // True if the message was automatically sent by the AI system
  isAutoReply?: boolean
  parentMessageId?: number
}

export interface ThreadType {
  id: number
  externalParticipantId: string
  participantName: string
  participantAvatar?: string
  source: 'instagram' | 'youtube'
  lastMessageAt: string
  lastMessageContent?: string
  status: 'active' | 'archived' | 'snoozed'
  unreadCount: number
  autoReply?: boolean
  isHighIntent?: boolean
  messages?: MessageType[]
}
