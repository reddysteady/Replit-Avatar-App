// See CHANGELOG.md for 2025-06-11 [Fixed]
// See CHANGELOG.md for 2025-06-14 [Added]
// See CHANGELOG.md for 2025-06-13 [Added]
// See CHANGELOG.md for 2025-06-13 [Fixed-2]
// See CHANGELOG.md for 2025-06-17 [Added-2]
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import express from 'express'
import type { Server } from 'http'
import { MemStorage } from './storage'

const mockAiService = {
  generateReply: vi.fn(),
  clearSystemPromptCache: vi.fn(), // ← FIXED
}
const mockContentService = { retrieveRelevantContent: vi.fn() }

vi.mock('./services/openai', () => ({ aiService: mockAiService }))
vi.mock('./services/content', () => ({ contentService: mockContentService }))
let server: Server
let baseUrl: string
let mem: MemStorage

process.env.OPENAI_API_KEY = 'test'

vi.mock('./storage', async () => {
  const actual = await vi.importActual<typeof import('./storage')>('./storage')
  mem = new actual.MemStorage()
  return { ...actual, storage: mem }
})

beforeAll(async () => {
  const { registerRoutes } = await import('./routes')
  const app = express()
  app.use(express.json())
  server = await registerRoutes(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const addr = server.address() as any
  baseUrl = `http://127.0.0.1:${addr.port}`
})

afterAll(() => {
  server?.close()
})

describe('test routes', () => {
  it('generate-batch creates messages', async () => {
    const beforeMsgs = (mem as any).msgs.size || 0
    const beforeThreads = (mem as any).threads.size || 0
    const res = await fetch(`${baseUrl}/api/test/generate-batch`, {
      method: 'POST',
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.count).toBe(10)
    const afterMsgs = (mem as any).msgs.size || 0
    const afterThreads = (mem as any).threads.size || 0
    expect(afterMsgs - beforeMsgs).toBe(10)
    expect(afterThreads - beforeThreads).toBeGreaterThanOrEqual(10)
    const messages = Array.from((mem as any).msgs.values()).slice(-10)
    const hi = messages.filter((m: any) => m.isHighIntent)
    expect(hi.length).toBeGreaterThanOrEqual(3)
  })

  it('generate-for-user adds message to thread', async () => {
    const thread = await mem.createThread({
      userId: 1,
      externalParticipantId: 'x',
      participantName: 'user',
      source: 'instagram',
      metadata: {},
    })
    const res = await fetch(
      `${baseUrl}/api/test/generate-for-user/${thread.id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Custom test message' }),
      },
    )
    expect(res.status).toBe(200)
    const msg = await res.json()
    expect(msg.threadId).toBe(thread.id)
    expect(msg.sender.name).toBe(thread.participantName)
    expect(msg.sender.avatar).toBeDefined()
    expect(msg.content).toBe('Custom test message')
    const msgs = await mem.getThreadMessages(thread.id)
    const stored = msgs.find((m) => m.id === msg.id)
    expect(stored?.content).toBe('Custom test message')
  })

  it('generate-for-user triggers auto-reply when enabled', async () => {
    await mem.updateSettings(1, {
      aiAutoRepliesInstagram: true,
      aiSettings: { autoReplyInstagram: true },
    })
    const thread = await mem.createThread({
      userId: 1,
      externalParticipantId: 'x',
      participantName: 'user',
      source: 'instagram',
      metadata: {},
    })
    await mem.updateThread(thread.id, { autoReply: true })
    mockAiService.generateReply.mockResolvedValueOnce('ok')
    const res = await fetch(
      `${baseUrl}/api/test/generate-for-user/${thread.id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'hi' }),
      },
    )
    expect(res.status).toBe(200)
    const msgs = await mem.getThreadMessages(thread.id)
    expect(msgs.length).toBe(2)
    const reply = msgs.find((m) => m.isOutbound)
    expect(reply?.content).toBe('ok')
    expect(mockAiService.generateReply).toHaveBeenCalled()
  })

  it('generate-reply returns AI response', async () => {
    const thread = await mem.createThread({
      userId: 1,
      externalParticipantId: 'p1',
      participantName: 'User',
      source: 'instagram',
      metadata: {},
    })
    await mem.addMessageToThread(thread.id, {
      content: 'Hi creator',
      source: 'instagram',
      externalId: 'm1',
      senderId: 'p1',
      senderName: 'User',
      userId: 1,
      metadata: {},
    })
    mockAiService.generateReply.mockResolvedValueOnce('dynamic reply')
    const res = await fetch(
      `${baseUrl}/api/threads/${thread.id}/generate-reply`,
      { method: 'POST' },
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(mockAiService.generateReply).toHaveBeenCalled()
    expect(data.generatedReply).toBe('dynamic reply')
  })

  it('message generate-reply uses AI service', async () => {
    const msg = await mem.createMessage({
      userId: 1,
      source: 'instagram',
      senderId: 'u1',
      senderName: 'User',
      content: 'Hi',
      externalId: 'm1',
      metadata: {},
    })
    mockAiService.generateReply.mockResolvedValueOnce('dynamic reply')
    const res = await fetch(
      `${baseUrl}/api/messages/${msg.id}/generate-reply`,
      { method: 'POST' },
    )
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.generatedReply).toBe('dynamic reply')
    expect(mockAiService.generateReply).toHaveBeenCalled()
  })

  it('content search returns results', async () => {
    mockContentService.retrieveRelevantContent.mockResolvedValueOnce(['c'])
    const res = await fetch(`${baseUrl}/api/content/search?q=test&userId=1`)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.results).toEqual(['c'])
    expect(mockContentService.retrieveRelevantContent).toHaveBeenCalledWith(
      'test',
      1,
      5,
    )
  })

  it('updates thread auto-reply flag', async () => {
    const thread = await mem.createThread({
      userId: 1,
      externalParticipantId: 'u',
      participantName: 'User',
      source: 'instagram',
      metadata: {},
    })

    const res = await fetch(`${baseUrl}/api/threads/${thread.id}/auto-reply`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoReply: true }),
    })
    const { thread: updated } = await res.json()
    expect(res.status).toBe(200)
    expect(updated.autoReply).toBe(true)
    const stored = await mem.getThread(thread.id)
    expect((stored as any).autoReply).toBe(true)
  })

  it('saves persona config', async () => {
    const payload = {
      personaConfig: {
        toneDescription: 't',
        styleTags: ['s'],
        allowedTopics: ['a'],
        restrictedTopics: ['r'],
        fallbackReply: 'f',
      },
    }
    const res = await fetch(`${baseUrl}/api/persona`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const debugBody = await res.clone().json()
    console.log('DEBUG persona →', res.status, debugBody)

    expect(res.status).toBe(200)
    const data = await res.json()
  })

  it('rejects invalid persona config', async () => {
    const payload = {
      personaConfig: {
        toneDescription: '',
        styleTags: [],
        allowedTopics: [],
        restrictedTopics: [],
        fallbackReply: '',
      },
    }
    const res = await fetch(`${baseUrl}/api/persona`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.message).toBeTruthy()
  })

  it('rejects invalid persona config', async () => {
    const payload = {
      personaConfig: {
        toneDescription: '',
        styleTags: [],
        allowedTopics: [],
        restrictedTopics: [],
        fallbackReply: '',
      },
      systemPrompt: '',
    }
    const res = await fetch(`${baseUrl}/api/persona`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.message).toBeTruthy()
  })

  it('rejects invalid persona config', async () => {
    const payload = {
      personaConfig: {
        toneDescription: '',
        styleTags: [],
        allowedTopics: [],
        restrictedTopics: [],
        fallbackReply: '',
      },
      systemPrompt: '',
    }
    const res = await fetch(`${baseUrl}/api/persona`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.message).toBeTruthy()
  })
})
