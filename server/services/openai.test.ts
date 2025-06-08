import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIService } from './openai'

var openaiMock = {
  embeddings: { create: vi.fn() },
  chat: { completions: { create: vi.fn() } }
}

vi.mock('openai', () => ({ default: vi.fn().mockImplementation(() => openaiMock) }))

const mockEmbeddings = openaiMock.embeddings
const mockCreate = openaiMock.chat.completions.create

describe('AIService', () => {
  let service: AIService

  beforeEach(() => {
    service = new AIService()
    mockCreate.mockReset()
    mockEmbeddings.create.mockReset()
  })

  it('generateEmbedding returns embedding array', async () => {
    mockEmbeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, 2, 3] }] })
    const res = await service.generateEmbedding('text')
    expect(res).toEqual([1, 2, 3])
  })

  it('generateEmbedding returns zeros on failure', async () => {
    mockEmbeddings.create.mockRejectedValueOnce(new Error('fail'))
    const res = await service.generateEmbedding('text')
    expect(res.length).toBe(1536)
    expect(res.every(n => n === 0)).toBe(true)
  })

  it('generateReply returns fallback when no api key', async () => {
    process.env.OPENAI_API_KEY = ''
    const reply = await service.generateReply({ content: 'hi', senderName: 'Bob', creatorToneDescription: '', temperature: 0.5, maxLength: 10 })
    expect(reply).toContain('Bob')
  })

  it('classifyIntent parses response', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ isHighIntent: true, confidence: 0.9, category: 'service_inquiry' }) } }] })
    const res = await service.classifyIntent('text')
    expect(res).toEqual({ isHighIntent: true, confidence: 0.9, category: 'service_inquiry' })
  })

  it('detectSensitiveContent parses response', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ isSensitive: true, confidence: 0.8, category: 'legal' }) } }] })
    const res = await service.detectSensitiveContent('text')
    expect(res).toEqual({ isSensitive: true, confidence: 0.8, category: 'legal' })
  })

  it('matchAutomationRules returns matching rules', async () => {
    const rules = [
      { enabled: true, triggerType: 'keywords', triggerKeywords: ['hello'] },
      { enabled: false, triggerType: 'keywords', triggerKeywords: ['hi'] }
    ]
    const res = await service.matchAutomationRules('Say hello', rules)
    expect(res.length).toBe(1)
  })
})
