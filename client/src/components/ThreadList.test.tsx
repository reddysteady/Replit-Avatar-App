import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ThreadList from './ThreadList'
import { ThreadType } from '@shared/schema'

const threads: ThreadType[] = [
  {
    id: 1,
    externalParticipantId: 'u1',
    participantName: 'Alice',
    participantAvatar: 'alice.png',
    source: 'instagram',
    lastMessageAt: new Date('2025-06-01').toISOString(),
    lastMessageContent: 'Hi',
    status: 'active',
    unreadCount: 2,
    autoReply: false,
    isHighIntent: false,
  },
  {
    id: 2,
    externalParticipantId: 'u2',
    participantName: 'Bob',
    participantAvatar: 'bob.png',
    source: 'youtube',
    lastMessageAt: new Date('2025-06-01').toISOString(),
    lastMessageContent: 'Hello',
    status: 'active',
    unreadCount: 0,
    autoReply: false,
    isHighIntent: false,
  },
]

describe('ThreadList unread filter', () => {
  it('shows only threads with unreadCount > 0 when source="unread"', () => {
    const qc = new QueryClient()
    qc.setQueryData(['/api/threads'], threads)
    const html = renderToStaticMarkup(
      <QueryClientProvider client={qc}>
        <ThreadList onSelectThread={() => {}} source="unread" />
      </QueryClientProvider>,
    )
    expect(html).toContain('Alice')
    expect(html).not.toContain('Bob')
  })
})
