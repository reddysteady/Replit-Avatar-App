// See CHANGELOG.md for 2025-06-10 [Added]
// See CHANGELOG.md for 2025-06-10 [Fixed]
// See CHANGELOG.md for 2025-06-11 [Changed]
// See CHANGELOG.md for 2025-06-15 [Changed]
// See CHANGELOG.md for 2025-06-16 [Fixed]
// See CHANGELOG.md for 2025-06-15 [Added]
// See CHANGELOG.md for 2025-06-18 [Changed - added Unread filter]
import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ThreadRow from './ThreadRow'
import { Search } from 'lucide-react'
import { ThreadType } from '@shared/schema'
import { sampleConversations } from '@/sampleConversations'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'

interface ThreadListProps {
  activeThreadId?: number | null
  onSelectThread: (threadId: number, threadData?: any) => void
  source?: 'all' | 'instagram' | 'youtube' | 'high-intent' | 'unread'
}

const ThreadList: React.FC<ThreadListProps> = ({
  activeThreadId,
  onSelectThread,
  source = 'all',
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const handleAutoReplyToggle = async (threadId: number, val: boolean) => {
    queryClient.setQueryData<ThreadType[] | undefined>(
      ['/api/threads'],
      (old) =>
        old?.map((t) => (t.id === threadId ? { ...t, autoReply: val } : t)),
    )
    try {
      await apiRequest('PATCH', `/api/threads/${threadId}/auto-reply`, {
        autoReply: val,
      })
    } finally {
      queryClient.invalidateQueries({ queryKey: ['/api/threads'] })
    }
  }

  const handleDeleteThread = async (threadId: number) => {
    queryClient.setQueryData<ThreadType[] | undefined>(
      ['/api/threads'],
      (old) => old?.filter((t) => t.id !== threadId),
    )
    setOpenPopoverId(null)
    try {
      const res = await fetch(`/api/threads/${threadId}`, { method: 'DELETE' })
      if (!res.ok) {
        throw new Error('delete failed')
      }
      toast({ title: 'Thread deleted' })
    } catch (err) {
      toast({
        title: 'Could not delete thread. Please try again.',
        variant: 'destructive',
      })
    } finally {
      queryClient.invalidateQueries({ queryKey: ['/api/threads'] })
    }
  }

  // Fetch threads from API
  const { data: threads, isLoading } = useQuery({
    queryKey: ['/api/threads'],
    staleTime: 10000, // 10 seconds
  })

  // Use sample conversations when the API returns an empty list
  const threadsData: ThreadType[] | undefined =
    threads && Array.isArray(threads) && threads.length > 0
      ? (threads as ThreadType[])
      : sampleConversations

  // Filter threads by source and search term
  const filteredThreads = React.useMemo(() => {
    if (!threadsData) return []

    return Array.isArray(threadsData)
      ? threadsData.filter((thread: ThreadType) => {
          // Filter by source, high intent, or unread status
          if (source === 'high-intent' && !thread?.isHighIntent) {
            return false
          } else if (source === 'unread' && thread.unreadCount <= 0) {
            return false
          } else if (
            source !== 'all' &&
            source !== 'high-intent' &&
            source !== 'unread' &&
            thread?.source !== source
          ) {
            return false
          }

          // Filter by search term
          if (searchTerm && thread?.participantName) {
            return (
              thread.participantName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              (thread.lastMessageContent &&
                thread.lastMessageContent
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()))
            )
          }

          return true
        })
      : [].sort((a: ThreadType, b: ThreadType) => {
          // Sort by last message date (newest first)
          return (
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
          )
        })
  }, [threadsData, source, searchTerm])

  return (
    <div className="flex flex-col h-full">
      {/* Search box */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Thread list */}
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent"></div>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm
              ? 'No matching conversations found'
              : 'No conversations yet'}
          </div>
        ) : (
          filteredThreads.map((thread: ThreadType) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              onClick={() => onSelectThread(thread.id, thread)}
              selected={thread.id === activeThreadId}
              handleAutoReplyToggle={handleAutoReplyToggle}
              openPopoverId={openPopoverId}
              setOpenPopoverId={setOpenPopoverId}
              onDeleteThread={handleDeleteThread}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default ThreadList
