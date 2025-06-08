import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('axios', () => ({
  default: { post: vi.fn(), get: vi.fn() }
}))
vi.mock('../storage', () => ({
  storage: {
    getSettings: vi.fn().mockResolvedValue({ apiKeys: {} }),
    updateSettings: vi.fn().mockResolvedValue({})
  }
}))
import axios from 'axios'
import { OAuthService } from './oauth'
const service = new OAuthService()

const mockedAxios = axios as unknown as { post: any, get: any }

describe('OAuthService', () => {
  beforeEach(() => {
    mockedAxios.post.mockReset()
    mockedAxios.get.mockReset()
  })

  it('exchangeInstagramCode returns token data', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { access_token: 't', user_id: 'u' } })
    const res = await service.exchangeInstagramCode('c', 'r', 'id', 'secret')
    expect(res).toEqual({ access_token: 't', user_id: 'u' })
  })

  it('getLongLivedToken returns token', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { access_token: 'long' } })
    const res = await service.getLongLivedToken('short', 'secret')
    expect(res).toBe('long')
  })

  it('getInstagramUserProfile returns data', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { id: '1', username: 'u', account_type: 'c', media_count: 0 } })
    const res = await service.getInstagramUserProfile('token')
    expect(res.id).toBe('1')
  })

  it('completeInstagramAuth returns success', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { access_token: 't', user_id: 'u' } })
    mockedAxios.get.mockResolvedValueOnce({ data: { access_token: 'long' } })
    mockedAxios.get.mockResolvedValueOnce({ data: { id: '1', username: 'u', account_type: 'c', media_count: 0 } })
    const res = await service.completeInstagramAuth('c','r','id','secret',1)
    expect(res.success).toBe(true)
  })
})
