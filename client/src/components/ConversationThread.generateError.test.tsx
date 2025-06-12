// See CHANGELOG.md for 2025-06-11 [Added]
// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import ConversationThread from './ConversationThread';
import { apiRequest } from '@/lib/queryClient';

vi.mock('@/lib/queryClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/queryClient')>('@/lib/queryClient');
  return { ...actual, apiRequest: vi.fn() };
});

const threadData = {
  participantName: 'Alice',
  participantAvatar: '',
  source: 'instagram',
  isHighIntent: false,
};

describe('ConversationThread generate reply failure', () => {
  it('shows error toast when API request fails', async () => {
    (apiRequest as unknown as any).mockRejectedValueOnce(new Error('500'));
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const client = new QueryClient();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      })),
    });

    act(() => {
      root.render(
        <QueryClientProvider client={client}>
          <Toaster />
          <ConversationThread threadId={1} threadData={threadData} messages={[]} />
        </QueryClientProvider>
      );
    });

    const button = container.querySelector('[data-testid="composer-generate"]') as HTMLButtonElement;
    act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await new Promise(res => setTimeout(res, 0));

    expect(container.textContent).toContain('Error generating reply');
  });
});
