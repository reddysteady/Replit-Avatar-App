import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ToolsDrawer from './ToolsDrawer'
import type { MessageThread } from '@shared/schema'

const threads: MessageThread[] = [
  {
    id: 1,
    createdAt: new Date(),
    userId: 1,
    externalParticipantId: '1',
    participantName: 'Demo',
    participantAvatar: null,
    source: 'instagram',
    lastMessageAt: new Date(),
    lastMessageContent: null,
    status: 'active',
    autoReply: false,
    unreadCount: 0,
    metadata: {}
  }
]

describe('ToolsDrawer', () => {
  it('focuses input when opened and closes on ESC', async () => {
    const onClose = vi.fn()
    render(
      <ToolsDrawer
        open={true}
        onClose={onClose}
        onGenerateBatch={vi.fn()}
        threads={threads}
        customThreadId=""
        setCustomThreadId={() => {}}
        customMessage=""
        setCustomMessage={() => {}}
        onSendCustom={vi.fn()}
        canSend
        onReloadDb={vi.fn()}
        onClearCache={vi.fn()}
        onSetupWebhook={vi.fn()}
      />
    )
    const input = screen.getByPlaceholderText('Custom message')
    expect(document.activeElement).toBe(input)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('calls handlers when buttons clicked', async () => {
    const onGenerateBatch = vi.fn()
    render(
      <ToolsDrawer
        open={true}
        onClose={() => {}}
        onGenerateBatch={onGenerateBatch}
        threads={threads}
        customThreadId=""
        setCustomThreadId={() => {}}
        customMessage=""
        setCustomMessage={() => {}}
        onSendCustom={vi.fn()}
        canSend
        onReloadDb={vi.fn()}
        onClearCache={vi.fn()}
        onSetupWebhook={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /Generate Batch Messages/i }))
    expect(onGenerateBatch).toHaveBeenCalled()
  })
})
