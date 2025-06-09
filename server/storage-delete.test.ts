// See CHANGELOG.md for 2025-06-11 [Added]
import { describe, it, expect } from 'vitest'
import { MemStorage } from './storage'

describe('MemStorage delete methods', () => {
  it('deletes a message and thread', async () => {
    const storage = new MemStorage()
    const thread = await storage.createThread({
      userId: 1,
      externalParticipantId: 'x',
      participantName: 'user',
      source: 'instagram',
      metadata: {}
    })
    await storage.addMessageToThread(thread.id, {
      content: 'hi',
      source: 'instagram',
      externalId: 'e1',
      senderId: 's',
      senderName: 's',
      userId: 1,
      metadata: {}
    })
    const deletedMsg = await storage.deleteMessage(1)
    expect(deletedMsg).toBe(true)
    const deletedThread = await storage.deleteThread(thread.id)
    expect(deletedThread).toBe(true)
  })
})
