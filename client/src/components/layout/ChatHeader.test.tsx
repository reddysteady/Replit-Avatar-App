import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatHeader from './ChatHeader';

const sampleProps = { name: 'Liz Cell', avatarUrl: '/liz.jpg', platform: 'instagram', onBack: () => {} };

describe('ChatHeader', () => {
  it('renders the user name and avatar', () => {
    const client = new QueryClient();
    const html = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <ChatHeader {...sampleProps} />
      </QueryClientProvider>
    );
    expect(html).toContain('Liz Cell');
    expect(html).toContain('/liz.jpg');
  });

  it('includes the back arrow icon', () => {
    const client = new QueryClient();
    const html = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <ChatHeader {...sampleProps} />
      </QueryClientProvider>
    );
    expect(html.includes('svg')).toBe(true);
  });
});
