// See CHANGELOG.md for 2025-06-11 [Added]
import { describe, it, expect, vi, beforeEach } from 'vitest'

let mem: any
var openaiMock = {
  embeddings: { create: vi.fn() },
  chat: { completions: { create: vi.fn() } }
}

vi.mock('openai', () => ({ default: vi.fn().mockImplementation(() => openaiMock) }))
vi.mock('../storage', async () => {
  const actual = await vi.importActual<typeof import('../storage')>('../storage')
  mem = new actual.MemStorage()
  return { ...actual, storage: mem }
})

const mockEmbeddings = openaiMock.embeddings
const mockCreate = openaiMock.chat.completions.create

describe('AIService', () => {
  let service: any

  beforeEach(async () => {
    const mod = await import('./openai')
    service = new mod.AIService()
    process.env.OPENAI_API_KEY = 'test-key'
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
    const reply = await service.generateReply({ content: 'hi', senderName: 'Bob', creatorToneDescription: '', temperature: 0.5, maxLength: 10, model: 'gpt-4' })
    expect(reply).toContain('Bob')
  })

  it('uses token from settings when env key missing', async () => {
    process.env.OPENAI_API_KEY = ''
    await mem.updateSettings(1, { openaiToken: 'set-key' })
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: 'ok' } }] })
    const reply = await service.generateReply({ content: 'hey', senderName: 'Ann', creatorToneDescription: '', temperature: 0.5, maxLength: 10 })
    expect(reply).toBe('ok')
    expect(mockCreate).toHaveBeenCalled()
  })

  it('passes flex service tier when enabled', async () => {
    process.env.OPENAI_API_KEY = 'test-key'
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: 'ok' } }] })
    await service.generateReply({ content: 'test', senderName: 'Bob', creatorToneDescription: '', temperature: 0.5, maxLength: 10, flexProcessing: true })
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ service_tier: 'flex' }))
  })

  it('uses provided model when making OpenAI request', async () => {
    process.env.OPENAI_API_KEY = 'test-key'
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: 'ok' } }] })
    await service.generateReply({ content: 'test', senderName: 'Bob', creatorToneDescription: '', temperature: 0.5, maxLength: 10, model: 'gpt-3.5-turbo' })
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-3.5-turbo' }))
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
