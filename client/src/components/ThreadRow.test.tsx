// See CHANGELOG.md for 2025-06-09 [Fixed]
// See CHANGELOG.md for 2025-06-09 [Fixed-3]
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ThreadRow from './ThreadRow';
import { ThreadType, MessageType } from '@shared/schema';

const sampleThread: ThreadType = {
  id: 1,
  externalParticipantId: 'u1',
  participantName: 'John Doe',
  participantAvatar: 'avatar.png',
  source: 'instagram',
  lastMessageAt: new Date('2025-06-01T00:00:00Z').toISOString(),
  lastMessageContent: 'Hello there',
  status: 'active',
  unreadCount: 0,
  isHighIntent: false,
  messages: [
    {
      id: 1,
      threadId: 1,
      source: 'instagram',
      content: 'Hello there',
      sender: { id: 'u1', name: 'John Doe' },
      timestamp: new Date('2025-06-01T00:00:00Z').toISOString(),
      status: 'new',
      isHighIntent: false,
    } as MessageType,
  ],
};

describe('ThreadRow', () => {
  it('renders participant name and message snippet', () => {
    const html = renderToStaticMarkup(
      <ThreadRow thread={sampleThread} selected={true} />
    );
    expect(html).toContain('John Doe');
    expect(html).toContain('Hello there');
    expect(html).toContain('bg-gray-300');
  });

  it('includes min-w-0 class for snippet truncation', () => {
    const html = renderToStaticMarkup(
      <ThreadRow thread={sampleThread} selected={false} />
    );
    expect(html).toContain('min-w-0');
  });
});
