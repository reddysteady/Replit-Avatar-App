// See CHANGELOG.md for 2025-06-09 [Added]
// See CHANGELOG.md for 2025-06-09 [Changed]
// See CHANGELOG.md for 2025-06-09 [Fixed]
// See CHANGELOG.md for 2025-06-10 [Added]
// See CHANGELOG.md for 2025-06-12 [Fixed]
// See CHANGELOG.md for 2025-06-10 [Fixed]
// See CHANGELOG.md for 2025-06-08 [Fixed]
// See CHANGELOG.md for 2025-06-11 [Changed]
// See CHANGELOG.md for 2025-06-11 [Added]
// See CHANGELOG.md for 2025-06-11 [Fixed]
// See CHANGELOG.md for 2025-06-13 [Added]
// See CHANGELOG.md for 2025-06-13 [Fixed]
// See CHANGELOG.md for 2025-06-11 [Changed-4]
// See CHANGELOG.md for 2025-06-14 [Added]
// See CHANGELOG.md for 2025-06-13 [Added-2]
// See CHANGELOG.md for 2025-06-12 [Changed-2]
// See CHANGELOG.md for 2025-06-17 [Changed]
// See CHANGELOG.md for 2025-06-16 [Changed-2]
// See CHANGELOG.md for 2025-06-17 [Fixed-2]
// See CHANGELOG.md for 2025-06-18 [Fixed]
import type { Express } from 'express'
import { faker } from '@faker-js/faker'
import { createServer, type Server } from 'http'
import { storage } from './storage'
// See CHANGELOG.md for 2025-06-13 [Fixed-2]
import { db } from './db'
import { z } from 'zod'
import { messages } from '@shared/schema'
import { eq, sql } from 'drizzle-orm'
import { instagramService } from './services/instagram'
import { youtubeService } from './services/youtube'
import { airtableService } from './services/airtable'
import { aiService } from './services/openai'
import { contentService } from './services/content'
import type { AvatarPersonaConfig } from '@/types/AvatarPersonaConfig'
import { oauthService } from './services/oauth'
import { log } from './logger'
import { personaStateManager } from './persona-state-manager'
import { chatLogger } from './services/chatLogger'
import { Request, Response } from 'express';

export async function registerRoutes(app: Express): Promise<Server> {
  // Threaded messages API endpoint with recursive SQL
  app.get('/api/messages/threaded', async (req, res) => {
    try {
      const { conversationId } = req.query

      if (!conversationId) {
        return res.status(400).json({ error: 'conversationId is required' })
      }

      // Recursive SQL query to get all messages with their parent-child relationships
      const flatMessages = await db.execute(sql`
        WITH RECURSIVE message_tree AS (
          -- Base case: root messages (no parent)
          SELECT 
            id::text,
            content,
            timestamp,
            parent_message_id::text,
            sender_id::text,
            0 as depth,
            ARRAY[id] as path
          FROM messages
          WHERE thread_id = ${conversationId}::integer
            AND (parent_message_id IS NULL OR parent_message_id = 0)

          UNION ALL

          -- Recursive case: child messages
          SELECT 
            m.id::text,
            m.content,
            m.timestamp,
            m.parent_message_id::text,
            m.sender_id::text,
            mt.depth + 1,
            mt.path || m.id
          FROM messages m
          JOIN message_tree mt ON m.parent_message_id = mt.id::integer
          WHERE m.thread_id = ${conversationId}::integer
        )
        SELECT * FROM message_tree 
        ORDER BY path, timestamp
      `)

      // Build nested structure from flat results
      const messageMap = new Map()
      const rootMessages = []

      // First pass: create all message objects
      for (const row of flatMessages.rows) {
        const message = {
          id: row.id,
          content: row.content,
          timestamp: row.timestamp,
          senderId: row.sender_id,
          parentMessageId: row.parent_message_id,
          depth: row.depth,
          replies: [],
        }
        messageMap.set(row.id, message)
      }

      // Second pass: build the tree structure
      for (const row of flatMessages.rows) {
        const message = messageMap.get(row.id)

        if (row.parent_message_id && messageMap.has(row.parent_message_id)) {
          // This is a reply - add to parent's replies array
          const parent = messageMap.get(row.parent_message_id)
          parent.replies.push(message)
        } else {
          // This is a root message
          rootMessages.push(message)
        }
      }

      res.json(rootMessages)
    } catch (error) {
      console.error('Error fetching threaded messages:', error)
      res.status(500).json({ error: 'Failed to fetch threaded messages' })
    }
  })

  // Test messaging endpoints - Using storage methods
  app.post('/api/test/generate-messages', async (req, res) => {
    try {
      const generateRandomMessages = (count: number) => {
        const messages = []

        // Arrays for more realistic test data
        const instagramNames = [
          'Sophia Ross',
          'Liam Chen',
          'Emma Johnson',
          'Noah Garcia',
          'Olivia Kim',
        ]
        const youtubeNames = [
          'Alex Taylor',
          'Mia Williams',
          'Lucas Brown',
          'Madison Lee',
          'Daniel Rodriguez',
        ]
        const avatars = [
          'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=64&h=64&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=64&h=64&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=64&h=64&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1573497019236-17f8177b81e8?w=64&h=64&fit=crop&crop=face',
        ]

        const instagramContents = [
          "Hi there! Just discovered your profile through a friend. Your content is exactly what I've been looking for!",
          "Your latest post really resonated with me. I've been following your work for months and it keeps getting better!",
          'Quick question - do you offer any tips for beginners who are just starting out? Love your approach!',
          'Been a fan for a while now. Your aesthetic and style are so unique compared to others in this space.',
          'The way you explained that concept in your latest post was so clear. I finally understand it now!',
          'Just wanted to say your page has been incredibly helpful for me as I navigate this industry. Thank you!',
          'Do you ever do meetups or live sessions? Would love to connect!',
        ]

        const youtubeContents = [
          "Your latest video was really helpful! Any chance you'll do a follow-up on more advanced techniques?",
          'Been watching your channel for months now. The quality just keeps improving! Love your editing style.',
          'That tutorial saved me so much time. Would you consider doing one on related tools as well?',
          'I tried the method you shared and it worked perfectly. Thanks for the detailed walkthrough!',
          'Quick question about something you mentioned at 5:23 in your latest video. Did you mean...?',
          'Your explanation was way clearer than anything else I found online. Subscribed immediately!',
          'Finally a channel that explains these concepts in a way that makes sense. Keep it up!',
        ]

        for (let i = 0; i < count; i++) {
          const isInstagram = Math.random() > 0.4 // 60% Instagram, 40% YouTube
          const isHighIntent = Math.random() > 0.8 // 20% high intent messages

          const randomTimestampOffset = Math.floor(Math.random() * 120) * 60000 // Random offset up to 120 minutes
          const timestamp = new Date(Date.now() - randomTimestampOffset)

          const source = isInstagram ? 'instagram' : 'youtube'
          const nameArray = isInstagram ? instagramNames : youtubeNames
          const contentArray = isInstagram ? instagramContents : youtubeContents

          const senderName =
            nameArray[Math.floor(Math.random() * nameArray.length)]
          const content =
            contentArray[Math.floor(Math.random() * contentArray.length)]
          const avatar = avatars[Math.floor(Math.random() * avatars.length)]

          // Create a unique but readable ID for the sender
          const senderId =
            senderName.toLowerCase().replace(/\s+/g, '.') +
            '.' +
            Math.floor(Math.random() * 1000)

          messages.push({
            source,
            content,
            externalId: 'test-' + source + '-' + Date.now() + '-' + i,
            senderId,
            senderName,
            senderAvatar: avatar,
            timestamp,
            status: 'new',
            isHighIntent,
            intentCategory: isHighIntent
              ? Math.random() > 0.5
                ? 'collaboration'
                : 'purchase_interest'
              : undefined,
            intentConfidence: isHighIntent
              ? Math.floor(70 + Math.random() * 30)
              : undefined,
            userId: 1,
          })
        }

        return messages
      }

      // Generate 10 random messages
      const messages = generateRandomMessages(10)

      // Create all the messages
      for (const message of messages) {
        await storage.createMessage(message)
      }

      res.json({ success: true, count: messages.length })
    } catch (error) {
      console.error('Error generating test messages:', error)
      res.status(500).json({ success: false, error: String(error) })
    }
  })

  app.post('/api/test/generate-high-intent', async (req, res) => {
    try {
      // Array of high-intent messages for better testing
      const highIntentMessages = [
        {
          source: 'instagram',
          content:
            'Hi there! I am really interested in working with you. Can you tell me more about your pricing and availability? I would love to get started as soon as possible!',
          senderName: 'Jamie Wilson',
          intentCategory: 'purchase_interest',
          intentConfidence: 95,
        },
        {
          source: 'instagram',
          content:
            "Your portfolio is exactly what I've been looking for. I've got a project with a $5k budget and a tight deadline - could we schedule a call to discuss the details?",
          senderName: 'Taylor Reynolds',
          intentCategory: 'purchase_interest',
          intentConfidence: 98,
        },
        {
          source: 'youtube',
          content:
            "I represent a lifestyle brand and we're looking for someone with your talent for our next campaign. What would be the best way to discuss collaboration opportunities?",
          senderName: 'Jordan Martinez',
          intentCategory: 'collaboration',
          intentConfidence: 92,
        },
      ]

      // Choose a random high-intent message
      const randomMessage =
        highIntentMessages[
          Math.floor(Math.random() * highIntentMessages.length)
        ]

      // Random avatar selection
      const avatars = [
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=64&h=64&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1573497019236-17f8177b81e8?w=64&h=64&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1573496358961-3c82861ab8f4?w=64&h=64&fit=crop&crop=face',
      ]
      const avatar = avatars[Math.floor(Math.random() * avatars.length)]

      // Create the senderId from the sender name
      const senderId =
        randomMessage.senderName.toLowerCase().replace(/\s+/g, '.') +
        '.' +
        Math.floor(Math.random() * 1000)

      // Create a high-intent message using the storage layer
      await storage.createMessage({
        source: randomMessage.source,
        content: randomMessage.content,
        externalId: 'high-intent-' + Date.now(),
        senderId,
        senderName: randomMessage.senderName,
        senderAvatar: avatar,
        timestamp: new Date(),
        status: 'new',
        isHighIntent: true,
        intentCategory: randomMessage.intentCategory,
        intentConfidence: randomMessage.intentConfidence,
        userId: 1,
      })

      res.json({ success: true })
    } catch (error) {
      console.error('Error generating high-intent message:', error)
      res.status(500).json({ success: false, error: String(error) })
    }
  })

  app.post('/api/test/generate-batch', async (_req, res) => {
    try {
      if (process.env.DEBUG_AI) {
        console.debug('[DEBUG-AI] starting batch generation')
      }

      const messages = [] as any[]
      const highIntentIndexes = new Set<number>()
      while (highIntentIndexes.size < 3) {
        highIntentIndexes.add(Math.floor(Math.random() * 10))
      }

      for (let i = 0; i < 10; i++) {
        const isHighIntent = highIntentIndexes.has(i)
        const source = Math.random() > 0.5 ? 'instagram' : 'youtube'

        if (process.env.DEBUG_AI) {
          console.debug('[DEBUG-AI] creating message', {
            index: i,
            isHighIntent,
            source,
          })
        }

        // See CHANGELOG.md for 2025-06-16 [Fixed]
        const senderId = faker.internet.userName().toLowerCase() + '.' + faker.string.nanoid(6)
        const senderName = faker.person.fullName()
        const senderAvatar = 'https://images.unsplash.com/photo-' + (1500000000000 + Math.floor(Math.random() * 1000)) + '?w=64&h=64&fit=crop&crop=face'

        const thread = await storage.findOrCreateThreadByParticipant(
          1,
          senderId,
          senderName,
          source,
          senderAvatar,
        )

        const message = await storage.addMessageToThread(thread.id, {
          source,
          content: faker.lorem.sentence(),
          externalId: 'faker-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + i,
          senderId,
          senderName,
          senderAvatar,
          timestamp: new Date(),
          status: 'new',
          isHighIntent,
          intentCategory: isHighIntent ? 'purchase_interest' : undefined,
          intentConfidence: isHighIntent
            ? faker.number.int({ min: 80, max: 100 })
            : undefined,
          userId: 1,
          metadata: {},
        })

        if (process.env.DEBUG_AI) {
          console.debug('[DEBUG-AI] created message', {
            id: message.id,
            threadId: thread.id,
          })
        }

        messages.push(message)
      }

      if (process.env.DEBUG_AI) {
        console.debug('[DEBUG-AI] batch generation complete', {
          count: messages.length,
        })
      }

      res.json({ success: true, count: messages.length })
    } catch (err) {
      console.error('Error generating batch:', err)
      if (process.env.DEBUG_AI) {
        console.error('[DEBUG-AI] batch generation failed', err)
      }
      res.status(500).json({ success: false, error: String(err) })
    }
  })

  // See CHANGELOG.md for 2025-06-10 [Added]
  // See CHANGELOG.md for 2025-06-10 [Fixed]
  app.post('/api/test/generate-for-user/:threadId', async (req, res) => {
    try {
      const threadId = parseInt(req.params.threadId)
      const thread = await storage.getThread(threadId)
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' })
      }

      const content =
        typeof req.body.content === 'string' &&
        req.body.content.trim().length > 0
          ? req.body.content
          : undefined

      const messageContent =
        content ?? ('Hi ' + thread.participantName + ', this is a test message.')

      // Ensure no id field is present in the message data
      const messageData = {
        source: thread.source || 'instagram',
        content: messageContent,
        externalId: 'faker-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        senderId: thread.externalParticipantId,
        senderName: thread.participantName,
        senderAvatar:
          thread.participantAvatar ||
          'https://images.unsplash.com/photo-' + (1500000000000 + Math.floor(Math.random() * 1000)) + '?w=64&h=64&fit=crop&crop=face',
        timestamp: new Date(),
        status: 'new',
        isHighIntent: false,
        isOutbound: false,
        userId: thread.userId,
        metadata: {},
      }

      const rawMsg = await storage.addMessageToThread(threadId, messageData)

      const mapped = {
        id: rawMsg.id,
        source: rawMsg.source as 'instagram' | 'youtube',
        content: rawMsg.content,
        sender: {
          id: rawMsg.senderId,
          name: rawMsg.senderName,
          avatar: rawMsg.senderAvatar ?? undefined,
        },
        timestamp: rawMsg.timestamp.toISOString(),
        status: rawMsg.status as 'new' | 'replied' | 'auto-replied',
        isHighIntent: rawMsg.isHighIntent || false,
        reply: rawMsg.reply ?? undefined,
        threadId: rawMsg.threadId ?? undefined,
        parentMessageId:
          rawMsg.parentMessageId !== undefined &&
          rawMsg.parentMessageId !== null
            ? Number(rawMsg.parentMessageId)
            : undefined,
        isOutbound: rawMsg.isOutbound || false,
        isAiGenerated: rawMsg.isAiGenerated ?? false,
      }

      // Auto-reply logic mirroring Instagram webhook
      const settings = await storage.getSettings(thread.userId)
      const aiSettings = settings.aiSettings as any

      if (aiSettings?.autoReplyInstagram && thread.autoReply) {
        const aiReplyContent = await aiService.generateReply({
          content: rawMsg.content,
          senderName: thread.participantName,
          temperature: aiSettings.temperature ?? 0.7,
          maxLength: aiSettings.maxResponseLength ?? 500,
          model: aiSettings.model ?? 'gpt-4o',
          flexProcessing: aiSettings.flexProcessing ?? false,
        })

        // Apply response delay if configured
        const delaySec = aiSettings?.responseDelay || 0
        if (delaySec > 0) {
          await new Promise((r) => setTimeout(r, delaySec * 1000))
        }

        await storage.addMessageToThread(threadId, {
          source: 'instagram',
          content: aiReplyContent,
          externalId: 'auto-' + Date.now(),
          senderId: '0',
          senderName: 'Auto-Reply Bot',
          senderAvatar: undefined,
          timestamp: new Date(),
          status: 'auto-replied',
          isOutbound: true,
          isAiGenerated: true,
          userId: thread.userId,
          metadata: {},
        })
      }

      res.json(mapped)
    } catch (err) {
      console.error('Error generating for user:', err)
      res.status(500).json({ success: false, error: String(err) })
    }
  })

  // Thread-based message endpoints
  app.get('/api/threads', async (req, res) => {
    try {
      const source = req.query.source as string | undefined
      const threads = await storage.getThreads(1, source)
      res.json(threads)
    } catch (error) {
      console.error('Error fetching threads:', error)
      res.status(500).json({ message: 'Failed to fetch message threads' })
    }
  })

  app.get('/api/threads/:id', async (req, res) => {
    try {
      const threadId = parseInt(req.params.id)
      const thread = await storage.getThread(threadId)

      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' })
      }

      res.json(thread)
    } catch (error) {
      console.error('Error fetching thread:', error)
      res.status(500).json({ message: 'Failed to fetch thread' })
    }
  })

  app.get('/api/threads/:id/messages', async (req, res) => {
    try {
      const threadId = parseInt(req.params.id)
      log('Fetching messages for thread ID: ' + threadId)

      // Get messages from storage
      const threadMessages = await storage.getThreadMessages(threadId)

      // More detailed logging to trace parent-child relationships
      log('Thread #' + threadId + ' contains ' + threadMessages.length + ' messages')

      // Track parent-child relationships for better debugging
      const parentMap = new Map()
      const childrenMap = new Map()

      // First pass - identify all parent-child relationships
      threadMessages.forEach((msg) => {
        if (msg.parentMessageId) {
          // This is a reply
          if (!childrenMap.has(msg.parentMessageId)) {
            childrenMap.set(msg.parentMessageId, [])
          }
          childrenMap.get(msg.parentMessageId).push(msg.id)
          parentMap.set(msg.id, msg.parentMessageId)

          log('Message ' + msg.id + ' is a reply to parent ' + msg.parentMessageId)
        } else {
          log('Message ' + msg.id + ' is a top-level message')
        }
      })

      // Log detailed information with full message content
      log(
        'Thread messages with parentIds: ' + JSON.stringify(
          threadMessages.map((m) => ({
            id: m.id,
            content: (m.content || '').substring(0, 50),
            parentId: m.parentMessageId,
            isReply: !!m.parentMessageId,
            hasReplies: childrenMap.has(m.id),
            timestamp: m.timestamp,
          }))
        )
      )

      // Make sure all messages have parentMessageId explicitly set as a number or null
      const processedMessages = threadMessages.map((message) => {
        let parentId = null
        if (
          message.parentMessageId !== undefined &&
          message.parentMessageId !== null
        ) {
          parentId = Number(message.parentMessageId)
          if (isNaN(parentId)) {
            parentId = null
          }
        }

        return {
          ...message,
          // Ensure parentMessageId is a number (not a string) or null
          parentMessageId: parentId,
        }
      })

      log(
        'Processed messages with parentIds: ' + JSON.stringify(
          processedMessages.map((m) => ({
            id: m.id,
            parentId: m.parentMessageId,
            type: typeof m.parentMessageId,
          })),
        ),
      )

      res.json(processedMessages)
    } catch (error) {
      console.error('Error fetching thread messages:', error)
      res.status(500).json({ message: 'Failed to fetch thread messages' })
    }
  })

  app.post('/api/threads/:id/read', async (req, res) => {
    try {
      const threadId = parseInt(req.params.id)
      const result = await storage.markThreadAsRead(threadId)
      res.json({ success: result })
    } catch (error) {
      console.error('Error marking thread as read:', error)
      res.status(500).json({ message: 'Failed to mark thread as read' })
    }
  })

  app.post('/api/threads/:id/reply', async (req, res) => {
    try {
      const threadId = parseInt(req.params.id)
      const { content, parentMessageId } = req.body

      if (!content) {
        return res.status(400).json({ message: 'Message content is required' })
      }

      // Get thread to determine source
      const thread = await storage.getThread(threadId)
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' })
      }

      // Ensure parentMessageId is properly handled
      let parentId = null

      if (parentMessageId !== undefined && parentMessageId !== null) {
        parentId = Number(parentMessageId)

        // Treat 0 as null to maintain proper root messages
        if (isNaN(parentId) || parentId === 0) {
          parentId = null
        }
      }

      log(
        'Creating reply to message ' + parentId + ', original value: ' + parentMessageId,
      )

      // Create outbound message (creator's reply)
      const message = await storage.addMessageToThread(threadId, {
        content,
        source: thread.source || 'instagram',
        isOutbound: true,
        status: 'replied',
        parentMessageId: parentId, // Use properly validated parentId
        isHighIntent: false,
        senderName: 'Creator',
        senderId: 'creator-id',
        senderAvatar: null,
        externalId: 'reply-' + Date.now(),
        metadata: {},
        isAiGenerated: false,
        userId: 1,
      })

      res.json(message)
    } catch (error) {
      console.error('Error sending reply:', error)
      res.status(500).json({ message: 'Failed to send reply' })
    }
  })

  app.post('/api/threads/:id/generate-reply', async (req, res) => {
    try {
      const threadId = parseInt(req.params.id)
      const thread = await storage.getThread(threadId)

      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' })
      }

      // Get thread messages for context
      const messages = await storage.getThreadMessages(threadId)

      // Get settings for AI parameters
      const settings = await storage.getSettings(1)

      // Generate AI reply using the OpenAI service and creator settings
      const generatedReply = await aiService.generateReply({
        content: messages[messages.length - 1]?.content ?? '',
        senderName: thread.participantName,
        personaConfig:
          settings.personaConfig as unknown as AvatarPersonaConfig | null,
        temperature: (settings.aiTemperature || 70) / 100,
        maxLength: settings.maxResponseLength || 300,
        model: settings.aiSettings?.model || 'gpt-4o',
        flexProcessing: settings.aiSettings?.flexProcessing || false,
      })

      res.json({ generatedReply })
    } catch (error) {
      console.error('Error generating AI reply:', error)
      res.status(500).json({ message: 'Failed to generate AI reply' })
    }
  })

  app.post('/api/threads/:id/status', async (req, res) => {
    try {
      const threadId = parseInt(req.params.id)
      const { status } = req.body

      if (!status || !['active', 'archived', 'snoozed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' })
      }

      const updatedThread = await storage.updateThread(threadId, { status })
      res.json(updatedThread)
    } catch (error) {
      console.error('Error updating thread status:', error)
      res.status(500).json({ message: 'Failed to update thread status' })
    }
  })

  // See CHANGELOG.md for 2025-06-15 [Added] – toggle auto-reply on a thread
  app.patch('/api/threads/:id/auto-reply', async (req, res) => {
    try {
      const threadId = Number(req.params.id)

      const Body = z.object({ autoReply: z.boolean() }).strict()
      const { autoReply } = Body.parse(req.body)

      const updatedThread = await storage.updateThread(threadId, {
        autoReply,
      })

      if (!updatedThread) {
        return res.status(404).json({ message: 'Thread not found' })
      }

      return res.json({ message: 'Auto-reply updated', thread: updatedThread })
    } catch (err: any) {
      console.error('Error updating auto-reply:', err)
      return res
        .status(500)
        .json({ message: 'Failed to update auto-reply setting' })
    }
  })

  app.delete('/api/threads/:id', async (req, res) => {
    try {
      const threadId = parseInt(req.params.id)
      const success = await storage.deleteThread(threadId)
      if (!success) {
        return res.status(404).json({ message: 'Thread not found' })
      }
      res.json({ success: true })
    } catch (error) {
      console.error('Error deleting thread:', error)
      res.status(500).json({ message: 'Failed to delete thread' })
    }
  })

  // API endpoints to get messages from different platforms
  app.get('/api/messages/instagram', async (req, res) => {
    try {
      // Use the storage interface to get all Instagram messages
      const messages = await storage.getInstagramMessages()
      res.json(messages)
    } catch (error) {
      console.error('Error fetching Instagram messages:', error)
      res.status(500).json({ error: String(error) })
    }
  })

  app.get('/api/messages/youtube', async (req, res) => {
    try {
      // Use the storage interface to get all YouTube messages
      const messages = await storage.getYoutubeMessages()
      res.json(messages)
    } catch (error) {
      console.error('Error fetching YouTube messages:', error)
      res.status(500).json({ error: String(error) })
    }
  })

  app.delete('/api/messages/:id', async (req, res) => {
    try {
      const messageId = parseInt(req.params.id)
      const success = await storage.deleteMessage(messageId)
      if (!success) {
        return res.status(404).json({ message: 'Message not found' })
      }
      res.json({ success: true })
    } catch (error) {
      console.error('Error deleting message:', error)
      res.status(500).json({ message: 'Failed to delete message' })
    }
  })

  // Generate AI reply for any message type
  app.post('/api/messages/:id/generate-reply', async (req, res) => {
    try {
      if (process.env.DEBUG_AI) {
        console.debug('[DEBUG-AI] POST /api/messages/:id/generate-reply', {
          id: req.params.id,
        })
      }
      const messageId = parseInt(req.params.id)
      if (isNaN(messageId)) {
        return res.status(400).json({ message: 'Invalid message ID' })
      }

      // Get the message
      const message = await storage.getMessage(messageId)
      if (!message) {
        return res.status(404).json({ message: 'Message not found' })
      }

      // Get user settings
      const settings = await storage.getSettings(1) // Default to user ID 1 for MVP

      // Sample context snippets for the creator's tone and style
      const contextSnippets = [
        'I prefer responding with energy and positivity to all comments.',
        'I always thank my audience for engaging and ask follow-up questions.',
        'My brand voice is friendly, approachable, and slightly humorous.',
      ]

      // Generate AI reply without sending it yet
      const aiReply = await aiService.generateReply({
        content: message.content,
        senderName: message.senderName,
        personaConfig:
          settings.personaConfig as unknown as AvatarPersonaConfig | null,
        temperature: (settings.aiTemperature || 70) / 100,
        maxLength: settings.maxResponseLength || 300,
        contextSnippets,
        model: settings.aiSettings?.model || 'gpt-4o',
        flexProcessing: settings.aiSettings?.flexProcessing || false,
      })

      if (process.env.DEBUG_AI) {
        console.debug('[DEBUG-AI] generated reply', aiReply)
      }

      // Return only the generated reply
      return res.json({
        generatedReply: aiReply,
        success: true,
      })
    } catch (error) {
      console.error('Error generating AI reply:', error)
      res.status(500).json({
        message: String(error),
        success: false,
      })
    }
  })

  // Instagram webhook endpoint
  app.get('/webhook/instagram', async (req, res) => {
    // Webhook verification (required by Facebook)
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']

    // Verify with token from environment or settings
    const settings = await storage.getSettings(1) // For MVP, assume user ID 1
    const verifyToken =
      process.env.INSTAGRAM_VERIFY_TOKEN ||
      settings.apiKeys?.instagramAppId ||
      'social_ai_avatar'

    // Facebook requires this verification step
    if (mode === 'subscribe' && token === verifyToken) {
      log('Instagram webhook verified')
      res.status(200).send(challenge)
    } else {
      console.error('Instagram webhook verification failed')
      res.status(403).json({ message: 'Verification failed' })
    }
  })

  // Instagram webhook POST endpoint to receive DM notifications
  app.post('/webhook/instagram', async (req, res) => {
    try {
      log('Received Instagram webhook: ' + JSON.stringify(req.body, null, 2))

      // Respond to Facebook/Instagram immediately (required)
      res.status(200).send('EVENT_RECEIVED')

      const data = req.body

      // Verify this is a page/Instagram message event
      if (data.object === 'instagram' || data.object === 'page') {
        // Process each entry (could be multiple in one webhook call)
        for (const entry of data.entry) {
          // Process each messaging event in this entry
          if (entry.messaging) {
            for (const messagingEvent of entry.messaging) {
              // Make sure this is a message event with content
              if (messagingEvent.message && messagingEvent.message.text) {
                // Process the incoming message
                const instagramMessage = {
                  id: messagingEvent.message.mid,
                  from: {
                    id: messagingEvent.sender.id,
                    username: 'instagram_user', // In production, use Profile API to get real username
                    profile_pic_url: undefined,
                  },
                  message: messagingEvent.message.text,
                  timestamp: messagingEvent.timestamp,
                }

                // Process and store the message
                const { message: savedMessage, thread } =
                  await instagramService.processNewMessage(instagramMessage, 1)

                // Check if auto-reply is enabled
                const settings = await storage.getSettings(1)
                const aiSettings = settings.aiSettings as any

                if (aiSettings?.autoReplyInstagram && thread.autoReply) {
                  // Generate AI reply
                  const aiReply = await aiService.generateReply({
                    content: instagramMessage.message,
                    senderName: instagramMessage.from.username,
                    temperature: (aiSettings.temperature || 70) / 100,
                    maxLength: aiSettings.maxResponseLength || 500,
                    model: aiSettings.model || 'gpt-4o',
                    flexProcessing: aiSettings.flexProcessing || false,
                  })

                  // Send reply to Instagram
                  const delaySec = aiSettings.responseDelay || 0
                  if (delaySec > 0) {
                    await new Promise((r) => setTimeout(r, delaySec * 1000))
                  }
                  await instagramService.sendReply(instagramMessage.id, aiReply)

                  // Update message status
                  await storage.updateMessageStatus(
                    savedMessage.id,
                    'auto-replied',
                    aiReply,
                    true,
                  )
                }
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error processing Instagram webhook:', error.message)
      // We've already sent 200 OK to Facebook, so we're just logging the error here
    }
  })

  // Instagram DM endpoints
  app.get('/api/instagram/messages', async (req, res) => {
    try {
      // First fetch existing messages
      let messages = await storage.getInstagramMessages()

      // If we have fewer than 5 messages, generate some new ones
      if (messages.length < 5) {
        // Generate 1-3 new messages
        await instagramService.fetchMessages(1)

        // Get the updated messages list
        messages = await storage.getInstagramMessages()
      }

      res.json(messages)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  app.post('/api/instagram/reply', async (req, res) => {
    try {
      const schema = z.object({
        messageId: z.number(),
        reply: z.string().min(1),
      })

      const { messageId, reply } = schema.parse(req.body)
      const message = await storage.getMessage(messageId)

      if (!message) {
        return res.status(404).json({ message: 'Message not found' })
      }

      await instagramService.sendReply(message.externalId, reply)

      const updatedMessage = await storage.updateMessageStatus(
        messageId,
        'replied',
        reply,
        false,
      )

      res.json(updatedMessage)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  app.post('/api/instagram/ai-reply', async (req, res) => {
    try {
      const schema = z.object({
        messageId: z.number(),
        useContext: z.boolean().optional().default(false),
      })
      const { messageId, useContext } = schema.parse(req.body)

      const message = await storage.getMessage(messageId)
      if (!message) {
        return res.status(404).json({ message: 'Message not found' })
      }

      const settings = await storage.getSettings(1) // For MVP, assume user ID 1

      // Get context snippets for RAG pipeline if requested
      let contextSnippets: string[] = []

      if (useContext) {
        // In our MVP, we'll use simple hard-coded context snippets about the creator
        // In production, these would come from the creator's content database
        contextSnippets = [
          'I prefer warm, vibrant colors for my tropical destination content.',
          'My editing style focuses on storytelling first, with technical aspects being secondary.',
          'I recommend the Sony A7IV with 24-70mm lens for most content creators.',
          'I use Adobe Premiere Pro for video editing and Lightroom for photos.',
          'My favorite travel destinations include Bali, Japan, and Costa Rica.',
        ]
      }

      // Generate AI reply with context from RAG pipeline
      let aiReply
      try {
        aiReply = await aiService.generateReply({
          content: message.content,
          senderName: message.senderName,
          personaConfig:
            settings.personaConfig as unknown as AvatarPersonaConfig | null,
          temperature: (settings.aiTemperature || 70) / 100, // Default to 0.7 if null
          maxLength: settings.maxResponseLength || 500, // Default to 500 if null,
          contextSnippets: useContext ? contextSnippets : undefined,
          model: settings.aiSettings?.model || 'gpt-4o',
          flexProcessing: settings.aiSettings?.flexProcessing || false,
        })
      } catch (aiError: any) {
        console.error('Error generating AI reply:', aiError.message)
        return res.status(500).json({
          message: 'Failed to generate AI reply: ' + aiError.message,
          fallback: true,
        })
      }

      // Send reply to Instagram (in a real app, this would use the actual Instagram API)
      try {
        const delaySec = settings.aiSettings?.responseDelay || 0
        if (delaySec > 0) {
          await new Promise((r) => setTimeout(r, delaySec * 1000))
        }
        await instagramService.sendReply(message.externalId, aiReply)
      } catch (instagramError) {
        log('Note: Instagram reply simulation - would fail in production app')
        // In development, we'll continue even if this fails
      }

      // Update message status
      const updatedMessage = await storage.updateMessageStatus(
        messageId,
        'auto-replied',
        aiReply,
        true,
      )

      res.json(updatedMessage)
    } catch (error: any) {
      console.error('Error handling AI reply request:', error)
      res.status(500).json({ message: error.message })
    }
  })

  // YouTube comment endpoints
  app.get('/api/youtube/messages', async (req, res) => {
    try {
      const messages = await storage.getYoutubeMessages()
      res.json(messages)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  app.post('/api/youtube/reply', async (req, res) => {
    try {
      const schema = z.object({
        messageId: z.number(),
        reply: z.string().min(1),
      })

      const { messageId, reply } = schema.parse(req.body)
      const message = await storage.getMessage(messageId)

      if (!message) {
        return res.status(404).json({ message: 'Message not found' })
      }

      await youtubeService.sendReply(message.externalId, reply)

      const updatedMessage = await storage.updateMessageStatus(
        messageId,
        'replied',
        reply,
        false,
      )

      res.json(updatedMessage)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  app.post('/api/youtube/ai-reply', async (req, res) => {
    try {
      const schema = z.object({ messageId: z.number() })
      const { messageId } = schema.parse(req.body)

      const message = await storage.getMessage(messageId)
      if (!message) {
        return res.status(404).json({ message: 'Message not found' })
      }

      const settings = await storage.getSettings(1) // For MVP, assume user ID 1

      // Generate AI reply
      const aiReply = await aiService.generateReply({
        content: message.content,
        senderName: message.senderName,
        personaConfig:
          settings.personaConfig as unknown as AvatarPersonaConfig | null,
        temperature: (settings.aiTemperature || 70) / 100,
        maxLength: settings.maxResponseLength || 500,
        model: settings.aiSettings?.model || 'gpt-4o',
        flexProcessing: settings.aiSettings?.flexProcessing || false,
      })

      // Send reply to YouTube
      const delaySec = settings.aiSettings?.responseDelay || 0
      if (delaySec > 0) {
        await new Promise((r) => setTimeout(r, delaySec * 1000))
      }
      await youtubeService.sendReply(message.externalId, aiReply)

      // Update message status
      const updatedMessage = await storage.updateMessageStatus(
        messageId,
        'auto-replied',
        aiReply,
        true,
      )

      res.json(updatedMessage)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  // AI endpoints
  app.post('/api/ai/generate-reply', async (req, res) => {
    try {
      const schema = z.object({
        content: z.string(),
        senderName: z.string(),
        source: z.enum(['instagram', 'youtube']),
        messageId: z.number().optional(),
        useContext: z.boolean().optional(),
      })

      const data = schema.parse(req.body)
      const settings = await storage.getSettings(1) // For MVP, assume user ID 1

      // Get relevant content snippets if context is requested
      let contextSnippets: string[] = []
      if (data.useContext) {
        // In production, these would come from contentService.retrieveRelevantContent
        // For MVP demo, we'll use sample content that mimics what would come from the RAG pipeline
        contextSnippets = [
          'I always tell creators to focus on authentic storytelling rather than chasing trends',
          'My ideal camera setup is the Sony A7IV with a 24-70mm lens for travel content',
          'When editing, I prefer to maintain natural colors with slight vibrance enhancement',
          'I believe consistency is more important than frequency when it comes to content creation',
          'My content creation philosophy centers on providing value first, monetization second',
        ]

        // For real implementation:
        // try {
        //   contextSnippets = await contentService.retrieveRelevantContent(
        //     data.content,
        //     1, // For MVP, assume user ID 1
        //     3 // Limit to 3 most relevant content items
        //   );
        // } catch (error) {
        //   console.warn("Error retrieving content context:", error);
        //   // Continue without context if retrieval fails
        // }
      }

      const reply = await aiService.generateReply({
        content: data.content,
        senderName: data.senderName,
        personaConfig:
          settings.personaConfig as unknown as AvatarPersonaConfig | null,
        temperature: (settings.aiTemperature || 70) / 100, // Default to 0.7 if null
        maxLength: settings.maxResponseLength || 500, // Default to 500 if null,
        contextSnippets:
          contextSnippets.length > 0 ? contextSnippets : undefined,
        model: settings.aiSettings?.model || 'gpt-4o',
        flexProcessing: settings.aiSettings?.flexProcessing || false,
      })

      res.json({ reply: reply })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  app.post('/api/ai/classify-intent', async (req, res) => {
    try {
      const schema = z.object({ text: z.string() })
      const { text } = schema.parse(req.body)

      const classification = await aiService.classifyIntent(text)
      res.json(classification)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  app.post('/api/ai/detect-sensitive', async (req, res) => {
    try {
      const schema = z.object({ text: z.string() })
      const { text } = schema.parse(req.body)

      const detection = await aiService.detectSensitiveContent(text)
      res.json(detection)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  // POST /api/ai/personality-extract - Extract personality from conversation with state management
  app.post('/api/ai/personality-extract', async (req: Request, res: Response) => {
    try {
      const { 
        messages, 
        currentConfig = {}, 
        initialMessage = false, 
        confirmedTraits,
        testMode = false,
        testCategory,
        testSessionId,
        isolationMode
      } = req.body

      // Detect test isolation headers
      const isIsolatedTest = req.headers['x-test-isolation'] === 'true'
      const testCategoryHeader = req.headers['x-test-category'] as string
      const sessionIdHeader = req.headers['x-test-session-id'] as string
      const cacheBypass = req.headers['x-cache-bypass'] === 'true'

      console.log('[PERSONALITY-EXTRACTION] Starting extraction with isolation controls:', {
        messageCount: messages?.length || 0,
        hasCurrentConfig: !!currentConfig,
        initialMessage,
        isTestPayload: messages?.some((m: any) => m.content?.includes('cracking jokes') || m.content?.includes('professional tone')),
        testMode: testMode || isIsolatedTest,
        testCategory: testCategory || testCategoryHeader,
        testSessionId: testSessionId || sessionIdHeader,
        isolationMode,
        cacheBypass,
        isolationLevel: isIsolatedTest ? 'STRICT' : 'NORMAL'
      })

      const startTime = Date.now()

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' })
      }

      // CRITICAL DEBUG: Log conversation content for trait extraction analysis
      const userMessages = messages?.filter(m => m.role === 'user') || []
      console.log('[TRAIT-EXTRACTION-DEBUG] Conversation analysis:', {
        totalUserMessages: userMessages.length,
        conversationKeywords: userMessages.join(' ').toLowerCase().split(' ').filter(w => 
          ['humor', 'humorous', 'joke', 'funny', 'help', 'helpful', 'casual', 'formal', 'creative', 'analytical'].includes(w)
        ),
        conversationSample: userMessages.slice(-3).map(msg => ({
          content: msg.content,
          length: msg.content.length,
          hasPersonalityWords: /humor|help|casual|creative|fun|serious|friendly|professional/i.test(msg.content)
        }))
      })

      // Handle session state for Phase 1
      let session = null
      const sessionId = req.body.sessionId || 'session_' + Date.now()
      if (sessionId) {
        console.log('[PERSONALITY-ENDPOINT] Restoring session:', sessionId)
        try {
          session = await personaStateManager.restoreSession(sessionId)
        } catch (sessionError) {
          console.warn('[PERSONALITY-ENDPOINT] Session restore failed:', sessionError.message)
        }
      }

      if (!session && !initialMessage) {
        console.log('[PERSONALITY-ENDPOINT] Creating new session')
        try {
          // Create new session for ongoing conversations
          session = await personaStateManager.createSession('1') // MVP: assume user ID 1
        } catch (sessionError) {
          console.warn('[PERSONALITY-ENDPOINT] Session creation failed:', sessionError.message)
        }
      }

      console.log('[PERSONALITY-ENDPOINT] Calling aiService.extractPersonalityFromConversation with isolation controls')
      
      const result = await aiService.extractPersonalityFromConversation(
        messages, 
        currentConfig, 
        initialMessage, 
        confirmedTraits, 
        testMode, 
        testCategory, 
        testSessionId,
        req.headers as Record<string, string> // Pass headers for isolation
      )

      // CRITICAL: Log extraction results to debug field collection
      console.log('[FIELD-EXTRACTION-DEBUG] AI extraction result analysis:', {
        hasExtractedData: !!result.extractedData,
        extractedFields: result.extractedData ? Object.keys(result.extractedData) : [],
        fieldValues: result.extractedData,
        messageCount: messages?.length || 0,
        lastUserMessage: messages?.filter(m => m.role === 'user')?.pop()?.content?.substring(0, 100)
      })

      // ENHANCED DEBUG: Detailed result analysis
      console.log('[PERSONALITY-ENDPOINT] aiService returned result:', {
        personaMode: result.personaMode,
        isComplete: result.isComplete,
        showChipSelector: result.showChipSelector,
        hasResponse: !!result.response,
        responseLength: result.response?.length || 0,
        hasExtractedData: !!result.extractedData && Object.keys(result.extractedData).length > 0,
        extractedDataKeys: result.extractedData ? Object.keys(result.extractedData) : [],
        extractedDataValues: result.extractedData,
        hasSuggestedTraits: !!result.suggestedTraits && result.suggestedTraits.length > 0,
        suggestedTraitsCount: result.suggestedTraits?.length || 0,
        suggestedTraitsDetail: result.suggestedTraits,
        fallbackUsed: result.fallbackUsed,
        confidenceScore: result.confidenceScore
      })

      // CRITICAL: Check if traits are being generated
      if (result.suggestedTraits && result.suggestedTraits.length > 0) {
        console.log('[TRAIT-EXTRACTION-SUCCESS] AI generated traits:', result.suggestedTraits.map(t => ({
          label: t.label,
          type: t.type,
          selected: t.selected
        })))
      } else {
        console.log('[TRAIT-EXTRACTION-FAILURE] No traits generated by AI - this will cause fallback behavior on client')
      }

      if (process.env.DEBUG_AI) {
        console.debug('[DEBUG-AI] Personality extract result:', {
          personaMode: result.personaMode,
          isComplete: result.isComplete,
          showChipSelector: result.showChipSelector,
          fallbackUsed: result.fallbackUsed
        })
      }

      // Log the conversation for review and enhancement
      const responseTime = Date.now() - startTime
      const lastUserMessage = messages?.filter(m => m.role === 'user')?.pop()?.content || ''

      if (lastUserMessage) {
        await chatLogger.logPersonalityExtraction(
          1, // MVP: assume user ID 1
          lastUserMessage,
          result,
          sessionId,
          responseTime
        )
      }

      // Enhanced logging for trait extraction testing
      console.log('[PERSONALITY-EXTRACTION] Completed with result:', {
        hasResponse: !!result.response,
        extractedDataKeys: Object.keys(result.extractedData || {}),
        personaMode: result.personaMode,
        showChipSelector: result.showChipSelector,
        suggestedTraits: result.suggestedTraits,
        traitsCount: result.suggestedTraits?.length || 0,
        extractedToneDescription: result.extractedData?.toneDescription,
        extractedStyleTags: result.extractedData?.styleTags,
        isTestPayload: messages?.some((m: any) => m.content?.includes('cracking jokes') || m.content?.includes('professional tone'))
      })

      // Log test-specific validation
      if (messages?.some((m: any) => m.content?.includes('cracking jokes') || m.content?.includes('humor'))) {
        console.log('[GPT-TEST-VALIDATION] Humor test - checking for humor-related traits:', {
          suggestedTraits: result.suggestedTraits,
          hasHumorTraits: result.suggestedTraits?.some((t: any) => 
            typeof t === 'string' ? 
              /humor|funny|witty|playful|comedy/i.test(t) :
              /humor|funny|witty|playful|comedy/i.test(t.label || '')
          ),
          toneDescription: result.extractedData?.toneDescription,
          styleTags: result.extractedData?.styleTags
        })
      }

      res.json(result)
    } catch (error: any) {
      console.error('[PERSONALITY-ENDPOINT] Error in personality extraction:', {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3),
        name: error.name,
        status: error.status
      })

      // Return a proper fallback response instead of just an error
      const fallbackQuestions = [
        "I'm curious - when someone asks you a question in your comments, what's your natural instinct? Do you dive deep, keep it snappy, or something in between?",
        "Hey there! I'm excited to help you create your AI avatar. Let's start with something fun - if your biggest fan asked you to describe your communication style in three words, what would they be?",
        "Here's something I'm wondering - when you're responding to your audience, do you find yourself being more of a teacher, a friend, or something else entirely?"
      ]

      const randomFallback = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)]

      const fallbackResult = {
        response: randomFallback,
        extractedData: {},
        isComplete: false,
        personaMode: 'guidance',
        confidenceScore: 0,
        showChipSelector: false,
        suggestedTraits: [],
        reflectionCheckpoint: false,
        fallbackUsed: true,
        errorRecovered: true
      }

      console.log('[PERSONALITY-ENDPOINT] Returning fallback result')
      res.json(fallbackResult) // Return 200 with fallback instead of 500
    }
  })

  app.get('/api/airtable/lead', async (req, res) => {
    try {
      const { baseId, tableName } = req.query

      if (!baseId || !tableName) {
        return res.status(400).json({ error: 'baseId and tableName are required' })
      }

      const result = await airtableService.getLeads(baseId as string, tableName as string)
      res.json(result)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  // Airtable lead capture
  app.post('/api/airtable/lead', async (req, res) => {
    try {
      const schema = z.object({
        messageId: z.number(),
        source: z.enum(['instagram', 'youtube']),
      })

      const { messageId, source } = schema.parse(req.body)
      const message = await storage.getMessage(messageId)

      if (!message) {
        return res.status(404).json({ message: 'Message not found' })
      }

      const settings = await storage.getSettings(1)

      // Add to Airtable
      const recordId = await airtableService.addLead({
        name: message.senderName,
        message: message.content,
        source,
        contactInfo: '', // In a real app, extract from message if available
        intentCategory: message.intentCategory || 'Interest',
        baseId: settings.airtableBaseId || '',
        tableName: settings.airtableTableName || 'Leads',
      })

      // Store lead in database
      const lead = await storage.createLead({
        messageId,
        userId: 1,
        name: message.senderName,
        source,
        intentCategory: message.intentCategory,
        contactInfo: '',
        notes: message.content,
        airtableRecordId: recordId,
        status: 'new',
      })

      res.json({ success: true, lead })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  // Instagram webhook setup endpoint
  app.post('/api/instagram/setup-webhook', async (req, res) => {
    try {
      // Use the dynamic protocol and host for webhook URL
      const baseUrl =
        process.env.WEBHOOK_BASE_URL || (req.protocol + '://' + req.get('host'))
      const webhookUrl = baseUrl + '/webhook/instagram'

      // Pass the user ID (using ID 1 for now) to the webhook setup
      const result = await instagramService.setupWebhook(webhookUrl, 1)

      if (result.success) {
        // Start polling immediately to fetch any existing messages
        await instagramService.fetchMessages(1)
      }

      res.json(result)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  // Fetch new Instagram messages manually (polling)
  app.post('/api/instagram/poll', async (req, res) => {
    try {
      const result = await instagramService.fetchMessages(1)
      res.json(result)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  // Instagram OAuth callback endpoint - receives the code from Instagram
  app.get('/api/instagram/callback', async (req, res) => {
    try {
      const code = req.query.code as string

      if (!code) {
        console.error('No authorization code received from Instagram')
        return res.redirect(
          '/?error=instagram_auth_failed&message=No%20authorization%20code%20received',
        )
      }

      log('Received Instagram authorization code')

      // For now, we'll use user ID 1 (will be dynamic with real user system)
      const userId = 1

      // Use the OAuth service to exchange code for token
      const redirectUri = req.protocol + '://' + req.get('host') + '/api/instagram/callback'
      const instagramAppId = process.env.INSTAGRAM_APP_ID || ''
      const instagramAppSecret = process.env.INSTAGRAM_APP_SECRET || ''

      // Complete the auth flow (exchange code, get long-lived token, get profile)
      const result = await oauthService.completeInstagramAuth(
        code,
        redirectUri,
        instagramAppId,
        instagramAppSecret,
        userId,
      )

      if (result) {
        log('Instagram authentication completed successfully')

        // Close the popup and redirect to Instagram page
        const html = '<html><body><script>if(window.opener){window.opener.postMessage("INSTAGRAM_AUTH_SUCCESS","*");window.close();}</script><p>Authentication successful! You can close this window.</p></body></html>'

        return res.send(html)
      } else {
        return res.redirect('/?error=instagram_auth_failed')
      }
    } catch (error: any) {
      console.error('Error in Instagram callback:', error.message)
      return res.redirect(
        '/?error=instagram_auth_failed&message=' +
          encodeURIComponent(error.message),
      )
    }
  })

  // Instagram OAuth client-side initiation endpoint
  app.post('/api/instagram/auth', async (req, res) => {
    try {
      const schema = z.object({
        code: z.string(),
        redirectUri: z.string().url(),
        clientId: z.string(),
        clientSecret: z.string(),
      })

      const { code, redirectUri, clientId, clientSecret } = schema.parse(
        req.body,
      )

      // Complete the OAuth flow
      const result = await oauthService.completeInstagramAuth(
        code,
        redirectUri,
        clientId,
        clientSecret,
        1, // For MVP, assume user ID 1
      )

      res.json(result)
    } catch (error: any) {
      console.error('Instagram auth error:', error.message)
    }
  })

  // Settings endpoints
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await storage.getSettings(1) // For MVP, assume user ID 1

      // Initialize default values for new JSON properties if they don't exist
      if (!settings.apiKeys) {
        settings.apiKeys = {
          instagram: settings.instagramToken || '',
          instagramAppId: '',
          instagramAppSecret: '',
          instagramUserId: '',
          instagramPageId: '',
          instagramWebhookUrl: '',
          youtube: settings.youtubeToken || '',
          openai: settings.openaiToken|| '',
          airtable: settings.airtableToken || '',
          airtableBaseId: settings.airtableBaseId || '',
          airtableTableName: settings.airtableTableName || 'Leads',
        }
      }

      if (!settings.aiSettings) {
        settings.aiSettings = {
          temperature: settings.aiTemperature
            ? settings.aiTemperature / 100
            : 0.7,
          maxResponseLength: settings.maxResponseLength || 500,
          model: settings.aiModel || 'gpt-4o',
          autoReplyInstagram: settings.aiAutoRepliesInstagram || false,
          autoReplyYoutube: settings.aiAutoRepliesYoutube || false,
          flexProcessing: false,
          responseDelay: 0,
        }
      }

      if (!settings.notificationSettings) {
        settings.notificationSettings = {
          email: settings.notificationEmail || '',
          notifyOnHighIntent: settings.notifyOnHighIntent || true,
          notifyOnSensitiveTopics: settings.notifyOnSensitiveTopics || true,
        }
      }

      const { personaConfig, ...settingsResponse } = settings
      res.json(settingsResponse)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  app.post('/api/settings', async (req, res) => {
    try {
      log('Settings POST request body: ' + JSON.stringify(req.body), 'debug')

      const schema = z.object({
        apiKeys: z
          .object({
            instagram: z.string().optional(),
            instagramAppId: z.string().optional(),
            instagramAppSecret: z.string().optional(),
            instagramUserId: z.string().optional(),
            instagramPageId: z.string().optional(),
            instagramWebhookUrl: z.string().optional(),
            youtube: z.string().optional(),
            openai: z.string().optional(),
            airtable: z.string().optional(),
            airtableBaseId: z.string().optional(),
            airtableTableName: z.string().optional(),
          })
          .optional(),
        aiSettings: z
          .object({
            temperature: z.number().min(0).max(1).optional(),
            maxResponseLength: z.number().min(50).max(200).optional(),
            model: z.string().optional(),
            autoReplyInstagram: z.boolean().optional(),
            autoReplyYoutube: z.boolean().optional(),
            flexProcessing: z.boolean().optional(),
            responseDelay: z.number().min(0).optional(),
          })
          .optional(),
        notificationSettings: z
          .object({
            email: z.string().email().optional(),
            notifyOnHighIntent: z.boolean().optional(),
            notifyOnSensitiveTopics: z.boolean().optional(),
          })
          .optional(),
      })

      const data = schema.parse(req.body)
      const userId = 1 // For MVP, assume user ID 1

      // Get existing settings
      const existingSettings = await storage.getSettings(userId)
      let updates: any = {}

      // Handle both new JSON fields and legacy fields for backward compatibility
      if (data.apiKeys) {
        // Update JSON fields
        updates.apiKeys = {
          ...(existingSettings.apiKeys as any),
          ...(data.apiKeys as any),
        }

        // Also update legacy fields for backward compatibility
        if (data.apiKeys.instagram !== undefined) {
          updates.instagramToken = data.apiKeys.instagram
        }
        if (data.apiKeys.youtube !== undefined) {
          updates.youtubeToken = data.apiKeys.youtube
        }
        if (data.apiKeys.openai !== undefined) {
          updates.openaiToken = data.apiKeys.openai
          log(
            data.apiKeys.openai
              ? 'OpenAI API key saved via settings.'
              : 'OpenAI API key cleared via settings.',
          )
        }
        if (data.apiKeys.airtable !== undefined) {
          updates.airtableToken = data.apiKeys.airtable
        }
        if (data.apiKeys.airtableBaseId !== undefined) {
          updates.airtableBaseId = data.apiKeys.airtableBaseId
        }
        if (data.apiKeys.airtableTableName !== undefined) {
          updates.airtableTableName = data.apiKeys.airtableTableName
        }
      }

      if (data.aiSettings) {
        // Update JSON field
        updates.aiSettings = {
          ...(existingSettings.aiSettings as any),
          ...(data.aiSettings as any),
        }

        // Also update legacy fields for backward compatibility
        if (data.aiSettings.temperature !== undefined) {
          updates.aiTemperature = Math.round(data.aiSettings.temperature * 100)
        }
        if (data.aiSettings.maxResponseLength !== undefined) {
          updates.maxResponseLength = data.aiSettings.maxResponseLength
        }
        if (data.aiSettings.model !== undefined) {
          updates.aiModel = data.aiSettings.model
        }
        if (data.aiSettings.autoReplyInstagram !== undefined) {
          updates.aiAutoRepliesInstagram = data.aiSettings.autoReplyInstagram
        }
        if (data.aiSettings.autoReplyYoutube !== undefined) {
          updates.aiAutoRepliesYoutube = data.aiSettings.autoReplyYoutube
        }
      }

      if (data.notificationSettings) {
        // Update JSON field
        updates.notificationSettings = {
          ...(existingSettings.notificationSettings as any),
          ...(data.notificationSettings as any),
        }

        // Also update legacy fields for backward compatibility
        if (data.notificationSettings.email !== undefined) {
          updates.notificationEmail = data.notificationSettings.email
        }
        if (data.notificationSettings.notifyOnHighIntent !== undefined) {
          updates.notifyOnHighIntent =
            data.notificationSettings.notifyOnHighIntent
        }
        if (data.notificationSettings.notifyOnSensitiveTopics !== undefined) {
          updates.notifyOnSensitiveTopics =
            data.notificationSettings.notifyOnSensitiveTopics
        }
      }

      const updatedSettings = await storage.updateSettings(userId, updates)
      res.json({ success: true, settings: updatedSettings })
    } catch (error: any) {
      log('Settings update error: ' + error.message, 'error')
      if (error.issues && Array.isArray(error.issues)) {
        // This is a Zod validation error
        const zodError = error.issues
          .map((issue: any) => issue.path.join('.') + ': ' + issue.message)
          .join(', ')
        return res
          .status(400)
          .json({ message: 'Validation error: ' + zodError })
      }
      res.status(500).json({ message: error.message })
    }
  })

  app.post('/api/settings/ai-auto-replies', async (req, res) => {
    try {
      log(
        'API Request received: /api/settings/ai-auto-replies ' + JSON.stringify(req.body),
      )

      const schema = z.object({
        enabled: z.boolean(),
        source: z.enum(['instagram', 'youtube']),
      })

      const { enabled, source } = schema.parse(req.body)
      const userId = 1 // For MVP, assume user ID 1

      log('Updating ' + source + ' auto-replies to: ' + enabled)

      // First get existing settings
      const existingSettings = await storage.getSettings(userId)
      log('Current settings: ' + JSON.stringify(existingSettings))

      let updates: any = {}
      if (source === 'instagram') {
        // Force a boolean value to avoid null or undefined issues
        updates.aiAutoRepliesInstagram = Boolean(enabled)

        // Also update the nested JSON field if it exists
        if (existingSettings.aiSettings) {
          updates.aiSettings = {
            ...existingSettings.aiSettings,
            autoReplyInstagram: Boolean(enabled),
          }
        } else {          // Create aiSettings if it doesn't exist
          updates.aiSettings = {
            autoReplyInstagram: Boolean(enabled),
            autoReplyYoutube: false,
            temperature: 0.7,
            maxResponseLength: 500,
            model: 'gpt-4o',
          }
        }
      } else {
        // Force a boolean value to avoid null or undefined issues
        updates.aiAutoRepliesYoutube = Boolean(enabled)

        // Also update the nested JSON field if it exists
        if (existingSettings.aiSettings) {
          updates.aiSettings = {
            ...existingSettings.aiSettings,
            autoReplyYoutube: Boolean(enabled),
          }
        } else {
          // Create aiSettings if it doesn't exist
          updates.aiSettings = {
            autoReplyInstagram: false,
            autoReplyYoutube: Boolean(enabled),
            temperature: 0.7,
            maxResponseLength: 500,
            model: 'gpt-4o',
          }
        }
      }

      log('Applying updates: ' + JSON.stringify(updates))

      const updatedSettings = await storage.updateSettings(userId, updates)
      log('Settings updated successfully: ' + JSON.stringify(updatedSettings))

      res.json({ success: true, settings: updatedSettings })
    } catch (error: any) {
      console.error('Error updating AI auto-replies:', error)
      res.status(500).json({ success: false, message: error.message })
    }
  })

  app.get('/api/persona', async (_req, res) => {
    const settings = await storage.getSettings(1)
    res.json({
      personaConfig: settings.personaConfig || null,
    })
  })

  app.post('/api/persona', async (req, res) => {
    try {
      const schema = z.object({
        personaConfig: z.object({
          toneDescription: z.string().min(1),
          styleTags: z.array(z.string().min(1)).min(1),
          allowedTopics: z.array(z.string().min(1)),
          restrictedTopics: z.array(z.string().min(1)),
          fallbackReply: z.string().min(1),
        }),
      })

      const { personaConfig } = schema.parse(req.body)
      const updated = await storage.updateSettings(1, {
        personaConfig,
      })

      // Clear the AI service cache when persona is updated
      aiService.clearSystemPromptCache(1)

      res.json({
        personaConfig: updated.personaConfig,
      })
    } catch (error: any) {
      res.status(400).json({ message: error.message })
    }
  })

  // Automation rules endpoints
  app.get('/api/automation/rules', async (req, res) => {
    try {
      const rules = await storage.getAutomationRules(1) // For MVP, assume user ID 1
      res.json(rules)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  app.post('/api/automation/rules', async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        enabled: z.boolean().default(true),
        triggerType: z.string().default('keywords'),
        triggerKeywords: z.array(z.string()).default([]),
        action: z.string().min(1),
        responseTemplate: z.string().optional(),
      })

      const data = schema.parse(req.body)
      const userId = 1 // For MVP, assume user ID 1

      const rule = await storage.createAutomationRule({
        ...data,
        userId,
      })

      res.json(rule)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  app.put('/api/automation/rules/:id', async (req, res) => {
    try {
      const ruleId = parseInt(req.params.id)
      if (isNaN(ruleId)) {
        return res.status(400).json({ message: 'Invalid rule ID' })
      }

      const schema = z.object({
        name: z.string().min(1),
        enabled: z.boolean(),
        triggerType: z.string(),
        triggerKeywords: z.array(z.string()),
        action: z.string().min(1),
        responseTemplate: z.string().optional(),
      })

      const data = schema.parse(req.body)
      const updatedRule = await storage.updateAutomationRule(ruleId, data)

      if (!updatedRule) {
        return res.status(404).json({ message: 'Rule not found' })
      }

      res.json(updatedRule)
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  app.delete('/api/automation/rules/:id', async (req, res) => {
    try {
      const ruleId = parseInt(req.params.id)
      if (isNaN(ruleId)) {
        return res.status(400).json({ message: 'Invalid rule ID' })
      }

      const success = await storage.deleteAutomationRule(ruleId)

      if (!success) {
        return res.status(404).json({ message: 'Rule not found' })
      }

      res.json({ success: true })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  // See CHANGELOG.md for 2025-06-14 [Added] – Content search endpoint
  app.get('/api/content/search', async (req, res) => {
    try {
      const q = req.query.q
      if (typeof q !== 'string' || q.trim() === '') {
        return res.status(400).json({ message: 'q is required' })
      }

      const userId = req.query.userId ? Number(req.query.userId) : 1
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 5

      const results = await contentService.retrieveRelevantContent(
        q,
        userId,
        limit,
      )
      res.json({ results })
    } catch (error: any) {
      console.error('Error searching content:', error)
      res.status(500).json({ message: 'Failed to search content' })
    }
  })

  // Database status endpoint
  app.get('/api/debug/database-status', async (req, res) => {
    try {
      const threads = await storage.getThreads(1)
      const instagramMessages = await storage.getInstagramMessages()
      const youtubeMessages = await storage.getYoutubeMessages()
      const status = {
        threadsCount: threads.length,
        instagramMessagesCount: instagramMessages.length,
        youtubeMessagesCount: youtubeMessages.length,
        threads: threads.map((t) => ({
          id: t.id,
          name: t.participantName,
          messageCount: 0,
        })),
        message: '',
      }

      // If no threads exist, create some test data
      if (threads.length === 0) {
        console.log('No threads found, creating test data...')

        // Create a few test threads with messages
        for (let i = 0; i < 3; i++) {
          const thread = await storage.findOrCreateThreadByParticipant(
            1,
            'test-user-' + i,
            'Test User ' + (i + 1),
            'instagram',
            'https://images.unsplash.com/photo-' + (1500000000000 + i) + '?w=64&h=64',
          )

          await storage.addMessageToThread(thread.id, {
            source: 'instagram',
            content: 'Hello, this is test message ' + (i + 1),
            externalId: 'test-' + Date.now() + '-' + i,
            senderId: 'test-user-' + i,
            senderName: 'Test User ' + (i + 1),
            timestamp: new Date(),
            status: 'new',
            isHighIntent: i === 1, // Make one high intent
            userId: 1,
            metadata: {},
          })
        }

        status.message = 'Created test data'
        const updatedThreads = await storage.getThreads(1)
        status.threadsCount = updatedThreads.length
        status.threads = updatedThreads.map((t) => ({
          id: t.id,
          name: t.participantName,
          messageCount: 0,
        }))
      }

      res.json(status)
    } catch (error) {
      const err = error as Error
      console.error('Database status check error:', err)
      res.status(500).json({ error: err.message })
    }
  })

  // Cache management endpoint
  app.post('/api/cache/clear', async (req, res) => {
    try {
      const { userId } = req.body
      aiService.clearSystemPromptCache(userId)

      // Also force clear the persona config from database
      await storage.updateSettings(1, {
        personaConfig: null as any,
        systemPrompt: null as any,
      })

      res.json({
        success: true,
        message: 'Cache cleared successfully',
      })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  // Analytics endpoint
  app.get('/api/analytics', async (req, res) => {
    try {
      const analytics = await storage.getAnalytics(1) // For MVP, assume user ID 1

      // Sample data for charts
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const engagementByDay = []
      for (let i = 0; i < 7; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const formattedDate = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })

        engagementByDay.unshift({
          date: formattedDate,
          instagram: Math.floor(Math.random() * 10) + 1,
          youtube: Math.floor(Math.random() * 8) + 1,
        })
      }

      res.json({
        messagesByPlatform: {
          instagram: analytics.instagramMsgCount,
          youtube: analytics.youtubeMsgCount,
        },
        messagesByStatus: {
          new: analytics.newMsgCount,
          replied: analytics.repliedMsgCount,
          autoReplied: analytics.autoRepliedMsgCount,
        },
        responseTimeAvg: analytics.avgResponseTimeMinutes,
        highIntentLeads: analytics.highIntentLeadsCount,
        engagementByDay,
        topTopics: analytics.topTopics || [
          { name: 'Pricing', count: 12 },
          { name: 'Features', count: 9 },
          { name: 'Support', count: 7 },
          { name: 'Collaboration', count: 5 },
          { name: 'Feedback', count: 4 },
        ],
        sensitiveTopicsCount: analytics.sensitiveTopicsCount,
      })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  })

  // Chat logging endpoints for review and enhancement
  app.get('/api/chat-logs', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1
      const limit = parseInt(req.query.limit as string) || 100
      const sessionId = req.query.sessionId as string

      let logs
      if (sessionId) {
        logs = await chatLogger.getSessionHistory(sessionId)
      } else {
        logs = await chatLogger.getChatHistory(userId, limit)
      }

      res.json({ logs, total: logs.length })
    } catch (error: any) {
      console.error('Error retrieving chat logs:', error)
      res.status(500).json({ error: 'Failed to fetch chat logs' })
    }
  })

  // Export chat logs as JSON for analysis
  app.get('/api/chat-logs/export', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1
      const logs = await chatLogger.getChatHistory(userId, 1000)

      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        totalLogs: logs.length,
        logs: logs.map(log => ({
          timestamp: log.timestamp,
          type: log.messageType,
          content: log.content,
          metadata: log.metadata
        }))
      }

      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', 'attachment; filename="chat-logs-' + userId + '-' + Date.now() + '.json"')
      res.json(exportData)
    } catch (error: any) {
      console.error('Error exporting chat logs:', error)
      res.status(500).json({ error: 'Failed to export chat logs' })
    }
  })

  // POST /api/ai/personality-extract - Extract personality from conversation with state management
  app.post('/api/ai/personality-extract', async (req, res) => {
    try {
      const { messages, currentConfig, initialMessage, confirmedTraits, testMode, testCategory } = req.body
      console.log('[PERSONALITY-BACKEND] Extracting for message: "' + message.substring(0, 50) + '..." (count: ' + messageCount + ')')

      const result = await aiService.extractPersonalityFromConversation(
        messages,
        currentConfig,
        initialMessage,
        confirmedTraits,
        testMode,
        testCategory
      )

      res.json(result)
    } catch (error: any) {
      console.error('Error in personality extraction:', error)

      const fallbackResponse = {
        error: 'Failed to process personality extraction',
        fallbackUsed: true,
        errorRecovered: true,
        response: "I'm having trouble processing that right now. Could you tell me more about what you're looking to achieve with your avatar?"
      }

      // Log the error recovery
      const sessionId = req.headers['x-session-id'] as string || 'session-' + Date.now()
      await chatLogger.logPersonalityExtraction(
        1, // userId
        req.body.message || 'Unknown message',
        fallbackResponse,
        sessionId,
        Date.now() - Date.now()
      )

      res.status(500).json(fallbackResponse)
    }
  })

  const httpServer = createServer(app)
  return httpServer
}