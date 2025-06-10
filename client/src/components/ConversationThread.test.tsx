import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ConversationThread from './ConversationThread';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MessageType } from '@shared/schema';

const messages: MessageType[] = [
  {
    id: 1,
    threadId: 1,
    source: 'instagram',
    content: 'Hi there',
    sender: { id: 'u1', name: 'Alice' },
    timestamp: new Date('2025-06-01T00:00:00Z').toISOString(),
    status: 'new',
    isHighIntent: false,
    isOutbound: false,
  },
  {
    id: 2,
    threadId: 1,
    source: 'instagram',
    content: 'Reply from me',
    sender: { id: 'u2', name: 'Me' },
    timestamp: new Date('2025-06-01T00:01:00Z').toISOString(),
    status: 'new',
    isHighIntent: false,
    isOutbound: true,
  }
];

describe('ConversationThread layout', () => {
  it('renders outbound messages with flex-row-reverse and no avatars', () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <ConversationThread threadId={1} messages={messages} />
      </QueryClientProvider>
    );
    const count = (html.match(/flex-row-reverse/g) || []).length;
    expect(count).toBe(1);
    expect(html.includes('<img')).toBe(false);
  });

  it('renders Generate Reply button in the composer', () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <ConversationThread threadId={1} messages={messages} />
      </QueryClientProvider>
    );
    expect(html.includes('data-testid="composer-generate"')).toBe(true);
  });
});
