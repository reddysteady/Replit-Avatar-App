import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import express from 'express'
import type { Server } from 'http'
import { MemStorage } from '../../../../../server/storage'
import { apiRequest } from '../../../lib/queryClient'

const mockAiService = { generateReply: vi.fn() }

vi.mock('../../../../../server/services/openai', () => ({ aiService: mockAiService }))

let server: Server
let baseUrl: string
let mem: MemStorage

vi.mock('../../../../../server/storage', async () => {
  const actual = await vi.importActual<typeof import('../../../../../server/storage')>('../../../../../server/storage')
  mem = new actual.MemStorage()
  return { ...actual, storage: mem }
})

beforeAll(async () => {
  const { registerRoutes } = await import('../../../../../server/routes')
  const app = express()
  app.use(express.json())
  server = await registerRoutes(app)
  await new Promise(resolve => server.listen(0, resolve))
  const addr = server.address() as any
  baseUrl = `http://127.0.0.1:${addr.port}`
})

afterAll(() => {
  server?.close()
})

it('posts custom message and auto-replies when enabled', async () => {
  await mem.updateSettings(1, { aiSettings: { autoReplyInstagram: true } })
  ;(mem as any).threadId = 42
  const thread = await mem.createThread({
    userId: 1,
    externalParticipantId: 'insta-1',
    participantName: 'Tester',
    source: 'instagram',
    metadata: {}
  })
  await mem.updateThread(thread.id, { autoReply: true })

  mockAiService.generateReply.mockResolvedValueOnce('🤖 auto-reply')

  const res = await apiRequest('POST', `${baseUrl}/api/test/generate-for-user/${thread.id}`, {
    content: 'Hello from the tester!'
  })
  expect(res.status).toBe(200)
  const msgs = await mem.getThreadMessages(thread.id)
  expect(msgs.length).toBe(2)
  const reply = msgs.find(m => m.isOutbound)
  expect(reply?.content).toBe('🤖 auto-reply')
  expect(mockAiService.generateReply).toHaveBeenCalled()
})
