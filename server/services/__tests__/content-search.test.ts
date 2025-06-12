import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import express from 'express'
import type { Server } from 'http'
import { MemStorage } from '../../storage'

const mockAiService = { generateEmbedding: vi.fn() }

vi.mock('../openai', () => ({ aiService: mockAiService }))
let server: Server
let baseUrl: string
let mem: MemStorage

vi.mock('../../storage', async () => {
  const actual = await vi.importActual<typeof import('../../storage')>('../../storage')
  mem = new actual.MemStorage()
  return { ...actual, storage: mem }
})

beforeAll(async () => {
  const { registerRoutes } = await import('../../routes')
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

describe('content search', () => {
  it('ranks results by similarity', async () => {
    await mem.createContentItem({
      externalId: '1',
      userId: 1,
      contentType: 'post',
      title: 'A',
      content: 'first',
      url: 'http://1',
      embedding: [1, 0],
      engagementScore: 1,
      metadata: {}
    })
    await mem.createContentItem({
      externalId: '2',
      userId: 1,
      contentType: 'post',
      title: 'B',
      content: 'second',
      url: 'http://2',
      embedding: [0, 1],
      engagementScore: 1,
      metadata: {}
    })
    await mem.createContentItem({
      externalId: '3',
      userId: 1,
      contentType: 'post',
      title: 'C',
      content: 'third',
      url: 'http://3',
      embedding: [0.5, 0.5],
      engagementScore: 1,
      metadata: {}
    })

    mockAiService.generateEmbedding.mockResolvedValueOnce([1, 0])
    const res = await fetch(`${baseUrl}/api/content/search?q=test&limit=3`)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.results).toEqual(['first', 'third', 'second'])
  })
})
