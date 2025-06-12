import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MessageItem from './MessageItem';
import { MessageType } from '@shared/schema';

const baseMessage: MessageType = {
  id: 1,
  source: 'instagram',
  content: 'Hi there',
  sender: { id: 'u1', name: 'User' },
  timestamp: new Date('2025-06-01T00:00:00Z').toISOString(),
  status: 'auto-replied',
  isHighIntent: false,
  isAiGenerated: true,
  isOutbound: true,
  reply: 'Hello',
  isAutoReply: true,
};

describe('MessageItem', () => {
  it('shows AI Reply label when isAutoReply is true', () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <MessageItem message={baseMessage} />
      </QueryClientProvider>
    );
    expect(html).toContain('AI Reply');
  });
});
