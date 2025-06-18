// See CHANGELOG.md for 2025-06-08 [Added]
// See CHANGELOG.md for 2025-06-10 [Changed]
// See CHANGELOG.md for 2025-06-11 [Changed]
// See CHANGELOG.md for 2025-06-11 [Fixed]
// See CHANGELOG.md for 2025-06-11 [Fixed-2]
// See CHANGELOG.md for 2025-06-09 [Fixed]
// See CHANGELOG.md for 2025-06-09 [Fixed-3]
// See CHANGELOG.md for 2025-06-15 [Changed]
// See CHANGELOG.md for 2025-06-17 [Changed]
// See CHANGELOG.md for 2025-06-18 [Added]

// See CHANGELOG.md for 2025-06-15 [Added]
import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ThreadType, MessageType } from '@shared/schema'
import { Switch } from '@/components/ui/switch'
import { BotIcon } from '@/components/ui/bot-icon'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Trash2 } from 'lucide-react'

interface ThreadRowProps {
  thread: ThreadType
  onClick?: () => void
  creatorId?: string
  selected?: boolean
  handleAutoReplyToggle?: (threadId: number, val: boolean) => void
  openPopoverId?: number | null
  setOpenPopoverId?: (id: number | null) => void
  onDeleteThread?: (id: number) => void
  onArchiveThread?: (id: number) => void
}

const fallbackUrl = 'https://via.placeholder.com/40'

const ThreadRow: React.FC<ThreadRowProps> = ({
  thread,
  onClick,
  creatorId = 'creator-id',
  selected = false,
  handleAutoReplyToggle,
  openPopoverId = null,
  setOpenPopoverId = () => {},
  onDeleteThread = () => {},
  onArchiveThread = () => {},
}) => {
  const isSelected = Boolean(selected)
  const lastMsg: MessageType | undefined = thread.messages?.at(-1)
  const lastMessageAt = lastMsg?.timestamp ?? thread.lastMessageAt
  const lastContent = lastMsg?.content ?? thread.lastMessageContent ?? ''

  const senderPrefix = lastMsg
    ? lastMsg.sender?.id === creatorId || lastMsg.isOutbound
      ? 'You:'
      : thread.participantName.split(' ')[0] + ':'
    : ''

  const snippet =
    lastContent.length > 60 ? lastContent.slice(0, 57) + '…' : lastContent

  return (
    <div
      className={`flex items-center rounded-lg border border-gray-300 px-3 py-2 mb-2 ${
        isSelected ? 'bg-gray-300' : 'bg-gray-50 hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      <img
        src={thread.participantAvatar ?? fallbackUrl}
        className={`w-10 h-10 rounded-full mr-3 ring-2 ${
          thread.isHighIntent ? 'ring-orange-500' : 'ring-gray-300'
        }`}
      />
      {/* Ensure flex item can shrink so the snippet truncates correctly */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <span className="font-semibold text-gray-900">
            {thread.participantName}
          </span>
          {thread.isHighIntent && (
            <span className="ml-2 bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-md">
              High Intent
            </span>
          )}
          <span className="ml-auto text-xs text-gray-600">
            {formatDistanceToNow(new Date(lastMessageAt), { addSuffix: true })}
          </span>
          {thread.unreadCount > 0 && (
            <span className="ml-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
          <Popover
            open={openPopoverId === thread.id}
            onOpenChange={(isOpen) =>
              setOpenPopoverId?.(isOpen ? thread.id : null)
            }
          >
            <PopoverTrigger asChild>
              <button
                className="ml-1 text-gray-400 hover:text-[#FF4545] p-2"
                aria-label="Delete Thread"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="bg-[#F7F7F8] rounded-2xl p-4 min-w-[220px] max-w-[90vw] shadow"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm text-gray-700 mb-3">Thread actions</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onArchiveThread?.(thread.id)
                  }}
                  className="bg-gray-200 text-sm px-4 py-2 min-h-[40px] min-w-[64px] rounded-2xl hover:bg-gray-300"
                >
                  Archive
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteThread?.(thread.id)
                  }}
                  className="bg-[#FF4545] text-white text-sm px-4 py-2 min-h-[40px] min-w-[64px] rounded-2xl hover:bg-red-600"
                >
                  Delete
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenPopoverId?.(null)
                  }}
                  className="text-gray-600 text-sm px-4 py-2 min-h-[40px] min-w-[64px] rounded-2xl hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="text-gray-700 text-sm truncate">
          {lastMsg && <span className="font-medium">{senderPrefix}</span>}{' '}
          {snippet}
        </div>
        <div className="flex items-center gap-2 mt-1 ml-auto text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <BotIcon className="w-4 h-4" />
            <span>AI Replies</span>
          </div>
          <Switch
            checked={thread.autoReply ?? false}
            onCheckedChange={(val) => handleAutoReplyToggle?.(thread.id, val)}
          />
        </div>
      </div>
    </div>
  )
}

export default ThreadRow
