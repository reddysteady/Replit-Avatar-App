import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../storage', () => ({
  storage: {
    createContentItem: vi.fn().mockResolvedValue({}),
    findSimilarContent: vi.fn().mockResolvedValue(['a']),
  }
}))
vi.mock('./openai', () => ({ aiService: { generateEmbedding: vi.fn().mockResolvedValue([0]) } }))

import { ContentService } from './content'
const service = new ContentService()

vi.spyOn<any, any>(service as any, 'fetchSampleContent').mockResolvedValue([
  { id: '1', type: 'post', url: '', title: 't', content: 'c', publishedAt: new Date(), engagement: { likes: 1, comments: 1, shares: 1 } }
])

describe('ContentService', () => {
  it('ingestContent processes content', async () => {
    const res = await service.ingestContent(1, true)
    expect(res.success).toBe(true)
    expect(res.processed).toBe(1)
  })

  it('retrieveRelevantContent returns content', async () => {
    const res = await service.retrieveRelevantContent('q', 1)
    expect(res).toEqual(['a'])
  })
})
