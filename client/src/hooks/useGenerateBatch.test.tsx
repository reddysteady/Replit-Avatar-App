// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { useGenerateBatch } from './useGenerateBatch';

function TestComponent() {
  useQuery({
    queryKey: ['messages'],
    queryFn: () => fetch('/api/messages').then(r => r.json()),
  });
  const { mutate } = useGenerateBatch();
  React.useEffect(() => {
    mutate();
  }, [mutate]);
  return null;
}

describe('useGenerateBatch', () => {
  it('invalidates messages query', async () => {
    const fetchMock = vi.fn((url: RequestInfo, opts?: RequestInit) => {
      if (String(url).includes('/api/messages')) {
        return Promise.resolve({ json: () => Promise.resolve([{ id: 1 }]) });
      }
      return Promise.resolve({ json: () => Promise.resolve([]) });
    });
    // @ts-ignore
    global.fetch = fetchMock;

    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <TestComponent />
      </QueryClientProvider>
    );
    await waitFor(() => {
      const data = client.getQueryData(['messages']);
      return Array.isArray(data) && data.length === 1;
    });
    expect(client.getQueryData(['messages'])).toHaveLength(1);
  });
});
