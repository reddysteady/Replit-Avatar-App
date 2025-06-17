import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import DesktopHeader from './DesktopHeader'

const sampleProps = {
  conversationData: {
    participantName: 'Liz Cell',
    participantAvatar: '/liz.jpg',
    platform: 'instagram',
    threadId: 1,
  },
}

describe('DesktopHeader', () => {
  it('renders conversation data and actions', () => {
    const client = new QueryClient()
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <DesktopHeader {...sampleProps} />
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(html).toContain('Liz Cell')
    expect(html).not.toContain('Conversations')
  })
})
