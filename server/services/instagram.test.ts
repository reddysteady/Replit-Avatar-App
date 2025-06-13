// See CHANGELOG.md for 2025-06-12 [Changed]
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import type { Server } from 'http'
import express from 'express'
import { MemStorage } from '../storage'

var mem: MemStorage
vi.mock('../storage', async () => {
  const actual = await vi.importActual<typeof import('../storage')>('../storage')
  mem = new actual.MemStorage()
  return { ...actual, storage: mem }
})
var mockAiService: any
vi.mock('./openai', () => {
  mockAiService = {
    classifyIntent: vi
      .fn()
      .mockResolvedValue({
        isHighIntent: false,
        confidence: 0.5,
        category: 'general',
      }),
    generateReply: vi.fn(),
  }
  return { aiService: mockAiService }
})

import { InstagramService } from './instagram'
const service = new InstagramService()

beforeEach(async () => {
  await mem.updateSettings(1, { apiKeys: { instagram: 'token' } })
})

describe('InstagramService', () => {
  it('fetchMessages returns success', async () => {
    const res = await service.fetchMessages(1)
    expect(res.success).toBe(true)
  })

  it('sendReply returns success', async () => {
    const res = await service.sendReply('1', 'hi')
    expect(res.success).toBe(true)
  })

  it('processNewMessage stores message', async () => {
    const msg = { id: '1', from: { id: 'u', username: 'name' }, message: 'hi', timestamp: new Date().toISOString() }
    const res = await service.processNewMessage(msg as any, 1)
    expect(res.message.threadId).toBe(res.thread.id)
    expect(res.message.content).toBe('hi')
  })

  it('setupWebhook returns success', async () => {
    const res = await service.setupWebhook('http://cb', 1)
    expect(res.success).toBe(true)
  })
})

describe('Instagram webhook auto-reply', () => {
  let server: any
  let baseUrl: string
  beforeAll(async () => {
    const { registerRoutes } = await import('../routes')
    const express = (await import('express')).default
    const app = express()
    app.use(express.json())
    server = await registerRoutes(app)
    await new Promise(resolve => server.listen(0, resolve))
    const addr = server.address()
    baseUrl = `http://127.0.0.1:${addr.port}`
    await mem.updateSettings(1, { aiAutoRepliesInstagram: true, aiSettings: { autoReplyInstagram: true } })
  })

  afterAll(() => {
    server?.close()
  })

  beforeEach(() => {
    mockAiService.generateReply.mockReset()
  })

  it('triggers auto-reply when thread flag enabled', async () => {
    vi.spyOn(mem, 'findOrCreateThreadByParticipant').mockResolvedValueOnce({
      id: 2,
      userId: 1,
      externalParticipantId: 'u1',
      participantName: 'u',
      source: 'instagram',
      createdAt: new Date(),
      lastMessageAt: new Date(),
      unreadCount: 0,
      status: 'active',
      autoReply: true,
      metadata: {},
    } as any)
    vi.spyOn(mem, 'addMessageToThread').mockResolvedValueOnce({
      id: 5,
      threadId: 2,
    } as any)
    mockAiService.generateReply.mockResolvedValueOnce('ok')

    const payload = {
      object: 'instagram',
      entry: [
        {
          messaging: [
            {
              sender: { id: 'u1' },
              message: { mid: 'm1', text: 'hi' },
              timestamp: Date.now(),
            },
          ],
        },
      ],
    }

    const res = await fetch(`${baseUrl}/webhook/instagram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    expect(res.status).toBe(200)
    expect(mockAiService.generateReply).toHaveBeenCalled()
  })

  it('skips auto-reply when thread flag disabled', async () => {
    vi.spyOn(mem, 'findOrCreateThreadByParticipant').mockResolvedValueOnce({
      id: 3,
      userId: 1,
      externalParticipantId: 'u1',
      participantName: 'u',
      source: 'instagram',
      createdAt: new Date(),
      lastMessageAt: new Date(),
      unreadCount: 0,
      status: 'active',
      autoReply: false,
      metadata: {},
    } as any)
    vi.spyOn(mem, 'addMessageToThread').mockResolvedValueOnce({
      id: 6,
      threadId: 3,
    } as any)

    const payload = {
      object: 'instagram',
      entry: [
        {
          messaging: [
            {
              sender: { id: 'u1' },
              message: { mid: 'm2', text: 'hi' },
              timestamp: Date.now(),
            },
          ],
        },
      ],
    }

    const res = await fetch(`${baseUrl}/webhook/instagram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    expect(res.status).toBe(200)
    expect(mockAiService.generateReply).not.toHaveBeenCalled()
  })
})
