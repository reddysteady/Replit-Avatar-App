import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../storage', () => ({
  storage: {
    getSettings: vi.fn().mockResolvedValue({ apiKeys: { instagram: 'token' } }),
    createMessage: vi.fn().mockResolvedValue({ id: 1 }),
    getAnalytics: vi.fn().mockResolvedValue({ instagramMsgCount: 0, newMsgCount: 0 }),
    updateAnalytics: vi.fn().mockResolvedValue({})
  }
}))
vi.mock('./openai', () => ({ aiService: { classifyIntent: vi.fn().mockResolvedValue({ isHighIntent: false, confidence: 0.5, category: 'general' }) } }))

import { InstagramService } from './instagram'
const service = new InstagramService()

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
    expect(res).toEqual({ id: 1 })
  })

  it('setupWebhook returns success', async () => {
    const res = await service.setupWebhook('http://cb', 1)
    expect(res.success).toBe(true)
  })
})
