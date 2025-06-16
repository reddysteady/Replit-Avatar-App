// See CHANGELOG.md for 2025-06-11 [Added]
// See CHANGELOG.md for 2025-06-11 [Fixed-3]
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIService } from './openai'
import { storage } from '../storage'
// Persona logic covered per docs/stage_1_persona.md
import { buildSystemPrompt } from '@shared/prompt'

const openaiMock = {
  embeddings: { create: vi.fn() },
  chat: { completions: { create: vi.fn() } },
}
var openaiCtor: any

vi.mock('../storage', () => ({
  storage: {
    getSettings: vi.fn().mockResolvedValue({ openaiToken: 'stored-key' }),
  },
}))

vi.mock('openai', () => {
  openaiCtor = vi.fn().mockImplementation(() => openaiMock)
  return { default: openaiCtor }
})

const mockEmbeddings = openaiMock.embeddings
const mockCreate = openaiMock.chat.completions.create

describe('AIService', () => {
  let service: AIService

  beforeEach(() => {
    service = new AIService()
    mockCreate.mockReset()
    mockEmbeddings.create.mockReset()
    openaiCtor.mockClear()
  })

  it('generateEmbedding returns embedding array', async () => {
    mockEmbeddings.create.mockResolvedValueOnce({
      data: [{ embedding: [1, 2, 3] }],
    })
    const res = await service.generateEmbedding('text')
    expect(res).toEqual([1, 2, 3])
  })

  it('generateEmbedding returns zeros on failure', async () => {
    mockEmbeddings.create.mockRejectedValueOnce(new Error('fail'))
    const res = await service.generateEmbedding('text')
    expect(res.length).toBe(1536)
    expect(res.every((n) => n === 0)).toBe(true)
  })

  it('generateReply returns fallback when no api key', async () => {
    process.env.OPENAI_API_KEY = ''
    ;(storage.getSettings as any).mockResolvedValueOnce({ openaiToken: '' })
    const reply = await service.generateReply({
      content: 'hi',
      senderName: 'Bob',
      creatorToneDescription: '',
      temperature: 0.5,
      maxLength: 10,
      model: 'gpt-4',
    })
    expect(reply).toContain('Bob')
  })

  it('passes flex service tier when enabled', async () => {
    process.env.OPENAI_API_KEY = 'sk-valid-env-key-123456'
    ;(storage.getSettings as any).mockResolvedValueOnce({ openaiToken: '' })
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'ok' } }],
    })
    await service.generateReply({
      content: 'test',
      senderName: 'Bob',
      creatorToneDescription: '',
      temperature: 0.5,
      maxLength: 10,
      flexProcessing: true,
    })
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ service_tier: 'flex' }),
    )
    expect(openaiCtor).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'sk-valid-env-key-123456' }),
    )
  })

  it('uses provided model when making OpenAI request', async () => {
    process.env.OPENAI_API_KEY = 'sk-valid-env-key-123456'
    ;(storage.getSettings as any).mockResolvedValueOnce({ openaiToken: '' })
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'ok' } }],
    })
    await service.generateReply({
      content: 'test',
      senderName: 'Bob',
      creatorToneDescription: '',
      temperature: 0.5,
      maxLength: 10,
      model: 'gpt-3.5-turbo',
    })
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-3.5-turbo' }),
    )
    expect(openaiCtor).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'sk-valid-env-key-123456' }),
    )
  })

  it('builds system prompt from persona config', async () => {
    process.env.OPENAI_API_KEY = 'sk-valid-env-key-123456'
    const persona = {
      toneDescription: 'zany',
      styleTags: ['fun'],
      allowedTopics: ['tech'],
      restrictedTopics: ['politics'],
      fallbackReply: 'nope',
    }
    ;(storage.getSettings as any).mockResolvedValueOnce({
      openaiToken: '',
      personaConfig: persona,
      systemPrompt: '',
    })
    ;(storage.getSettings as any).mockResolvedValueOnce({
      openaiToken: '',
      personaConfig: persona,
      systemPrompt: '',
    })
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'ok' } }],
    })
    await service.generateReply({
      content: 'hi',
      senderName: 'Bob',
      creatorToneDescription: '',
      temperature: 0.5,
      maxLength: 10,
    })
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('zany'),
          },
          expect.any(Object),
        ],
      }),
    )
  })

  it('falls back to default prompt when persona config missing', async () => {
    process.env.OPENAI_API_KEY = 'sk-valid-env-key-123456'
    ;(storage.getSettings as any).mockResolvedValueOnce({
      openaiToken: '',
      personaConfig: null,
      systemPrompt: '',
    })
    ;(storage.getSettings as any).mockResolvedValueOnce({
      openaiToken: '',
      personaConfig: null,
      systemPrompt: '',
    })
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'ok' } }],
    })
    await service.generateReply({
      content: 'hi',
      senderName: 'Bob',
      creatorToneDescription: '',
      temperature: 0.5,
      maxLength: 10,
    })
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: 'system',
            content: expect.any(String),
          },
          expect.any(Object),
        ],
      }),
    )
  })

  it('classifyIntent parses response', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isHighIntent: true,
              confidence: 0.9,
              category: 'service_inquiry',
            }),
          },
        },
      ],
    })
    const res = await service.classifyIntent('text')
    expect(res).toEqual({
      isHighIntent: true,
      confidence: 0.9,
      category: 'service_inquiry',
    })
  })

  it('detectSensitiveContent parses response', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isSensitive: true,
              confidence: 0.8,
              category: 'legal',
            }),
          },
        },
      ],
    })
    const res = await service.detectSensitiveContent('text')
    expect(res).toEqual({
      isSensitive: true,
      confidence: 0.8,
      category: 'legal',
    })
  })

  it('uses stored token when env key missing', async () => {
    process.env.OPENAI_API_KEY = ''
    mockEmbeddings.create.mockResolvedValueOnce({ data: [{ embedding: [4] }] })
    const res = await service.generateEmbedding('hi')
    expect(res).toEqual([4])
    expect(openaiCtor).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'stored-key' }),
    )
  })

  it('prefers stored token over env key', async () => {
    process.env.OPENAI_API_KEY = 'sk-valid-env-key-123456'
    mockEmbeddings.create.mockResolvedValueOnce({ data: [{ embedding: [5] }] })
    const res = await service.generateEmbedding('hi')
    expect(res).toEqual([5])
    expect(openaiCtor).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'stored-key' }),
    )
  })

  it('matchAutomationRules returns matching rules', async () => {
    const rules = [
      { enabled: true, triggerType: 'keywords', triggerKeywords: ['hello'] },
      { enabled: false, triggerType: 'keywords', triggerKeywords: ['hi'] },
    ]
    const res = await service.matchAutomationRules('Say hello', rules)
    expect(res.length).toBe(1)
  })
})
