import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../storage', () => ({
  storage: {
    createContentItem: vi.fn().mockResolvedValue({}),
    findSimilarContent: vi.fn().mockResolvedValue(['a']),
  },
}))
vi.mock('./openai', () => ({
  aiService: { generateEmbedding: vi.fn().mockResolvedValue([0]) },
}))

import { ContentService, ContentSourceFetcher } from './content'

const fetcher1: ContentSourceFetcher = {
  fetch: vi
    .fn()
    .mockResolvedValue([
      {
        id: '1',
        type: 'post',
        url: '',
        title: 't',
        content: 'c',
        publishedAt: new Date(),
        engagement: { likes: 1, comments: 1, shares: 1 },
      },
    ]),
}

const fetcher2: ContentSourceFetcher = {
  fetch: vi
    .fn()
    .mockResolvedValue([
      {
        id: '2',
        type: 'video',
        url: '',
        title: 't2',
        content: 'c2',
        publishedAt: new Date(),
        engagement: { likes: 2, comments: 2, shares: 2 },
      },
    ]),
}

const service = new ContentService([fetcher1, fetcher2])

describe('ContentService', () => {
  it('ingestContent processes content', async () => {
    const res = await service.ingestContent(1, true)
    expect(res.success).toBe(true)
    expect(res.processed).toBe(2)
    expect(fetcher1.fetch).toHaveBeenCalled()
    expect(fetcher2.fetch).toHaveBeenCalled()
  })

  it('retrieveRelevantContent returns content', async () => {
    const res = await service.retrieveRelevantContent('q', 1)
    expect(res).toEqual(['a'])
  })
})
