import { describe, it, expect, vi } from 'vitest'

vi.mock('../storage', () => ({
  storage: {
    getSettings: vi.fn().mockResolvedValue({ youtubeToken: 't' }),
    createMessage: vi.fn().mockResolvedValue({ id: 1 })
  }
}))

import { YouTubeService } from './youtube'
const service = new YouTubeService()

describe('YouTubeService', () => {
  it('fetchComments returns success', async () => {
    const res = await service.fetchComments(1)
    expect(res).toEqual({ success: true, message: 'Comments retrieved' })
  })

  it('sendReply returns success', async () => {
    const res = await service.sendReply('c', 'hi')
    expect(res.success).toBe(true)
  })

  it('processNewComment stores message', async () => {
    const comment = { id: '1', snippet: { authorDisplayName: 'a', authorProfileImageUrl: '', authorChannelId: 'c', textDisplay: 'text', publishedAt: new Date().toISOString(), videoId: 'v' } }
    const res = await service.processNewComment(comment as any, 1)
    expect(res).toEqual({ id: 1 })
  })

  it('setupPolling returns success', async () => {
    const res = await service.setupPolling(1)
    expect(res.success).toBe(true)
  })
})
