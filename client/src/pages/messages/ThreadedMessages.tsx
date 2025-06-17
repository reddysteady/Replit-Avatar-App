// See CHANGELOG.md for 2025-06-12 [Changed - ChatHeader mobile only]
// See CHANGELOG.md for 2025-06-14 [Changed - hide headers on mobile]
// See CHANGELOG.md for 2025-06-11 [Added]
// See CHANGELOG.md for 2025-06-12 [Fixed]
// See CHANGELOG.md for 2025-06-09 [Changed]
// See CHANGELOG.md for 2025-06-09 [Changed - dropdown alignment]
// See CHANGELOG.md for 2025-06-09 [Changed - thread dropdown]
// See CHANGELOG.md for 2025-06-10 [Fixed - batch invalidation keys]
// See CHANGELOG.md for 2025-06-10 [Added]
// See CHANGELOG.md for 2025-06-10 [Fixed - hide mobile filter dropdown in conversation view]
// See CHANGELOG.md for 2025-06-12 [Changed - mobile header integrates menu]
// See CHANGELOG.md for 2025-06-13 [Fixed-2]
// See CHANGELOG.md for 2025-06-12 [Changed - show ChatHeader only in conversation view]
// See CHANGELOG.md for 2025-06-13 [Removed - Messages page header]
// See CHANGELOG.md for 2025-06-12 [Fixed - mobile header visibility]
// See CHANGELOG.md for 2025-06-14 [Added - header generate message]
// See CHANGELOG.md for 2025-06-18 [Fixed - restore mobile burger menu]
// See CHANGELOG.md for 2025-06-19 [Fixed - remove conversation top padding]
// See CHANGELOG.md for 2025-06-16 [Added - debug log for custom message]
import React, { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ThreadList from '@/components/ThreadList'
import ConversationThread from '@/components/ConversationThread'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { Loader2, SearchX, ChevronDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import ChatHeader from '@/components/layout/ChatHeader'

// See CHANGELOG.md for 2025-06-17 [Removed - duplicate MobileHeader]

import { ThreadType, Settings } from '@shared/schema'

interface ThreadedMessagesProps {
  onConversationDataChange?: (
    data: {
      participantName?: string
      participantAvatar?: string
      platform?: string
      threadId?: number
      onBack?: () => void
    } | null,
  ) => void
  onBack?: () => void
}

const ThreadedMessages: React.FC<ThreadedMessagesProps> = ({
  onConversationDataChange,
  onBack,
}) => {
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null)
  const [hasSelectedThread, setHasSelectedThread] = useState(false)
  const [activeTab, setActiveTab] = useState<
    'all' | 'instagram' | 'youtube' | 'high-intent'
  >('all')
  const [isMobile, setIsMobile] = useState(false)
  const [showThreadList, setShowThreadList] = useState(true)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [customThreadId, setCustomThreadId] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [activeThreadData, setActiveThreadData] = useState<ThreadType | null>(
    null,
  )

  const handleGenerateCustomMessage = useCallback((msg: string) => {
    if (!activeThreadId) return
    fetch(`/api/test/generate-for-user/${activeThreadId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: msg }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((t) => {
            throw new Error(`Server error: ${t}`)
          })
        }
        return res.json()
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/threads'] })
        toast({
          title: 'Message generated',
          description: `Message added to thread ${activeThreadId}`,
        })
      })
      .catch((err) => {
        console.error('Generate error:', err)
        toast({
          title: 'Error',
          description: String(err),
          variant: 'destructive',
        })
      })
  }, [activeThreadId, queryClient, toast])

  // Check for mobile view on mount and on resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }

    // Initial check
    checkMobile()

    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Show or hide thread list based on active thread when on mobile
  useEffect(() => {
    if (isMobile) {
      if (activeThreadId && activeThreadData) {
        setShowThreadList(false)
        // Pass conversation data to parent for MobileHeader
        if (onConversationDataChange) {
          onConversationDataChange({
            participantName: activeThreadData.participantName,
            participantAvatar: activeThreadData.participantAvatar,
            platform: activeThreadData.source,
            threadId: activeThreadId,
            onBack: handleBack,
          })
        }
      } else {
        setShowThreadList(true)
        // Clear conversation data when returning to thread list
        if (onConversationDataChange) {
          onConversationDataChange(null)
        }
      }
    } else {
      setShowThreadList(true)
      // Pass conversation data for desktop header when thread is selected
      if (onConversationDataChange) {
        if (activeThreadId && activeThreadData) {
          onConversationDataChange({
            participantName: activeThreadData.participantName,
            participantAvatar: activeThreadData.participantAvatar,
            platform: activeThreadData.source,
            threadId: activeThreadId,
            onBack: handleBack,
          })
        } else {
          onConversationDataChange(null)
        }
      }
    }
  }, [isMobile, activeThreadId, activeThreadData, onConversationDataChange])

  // Check for empty threads
  const {
    data: threads,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/threads'],
    staleTime: 30000, // Increase stale time to 30 seconds
    refetchInterval: 60000, // Refetch every minute instead of more frequently
  })

  // Handle thread selection
  const handleThreadSelect = useCallback((threadId: number, threadData: any = null) => {
    setActiveThreadId(threadId)
    setHasSelectedThread(true)

    // Store thread data for consistent profile rendering
    if (threadData) {
      // Make sure we capture all thread data for profile display
      setActiveThreadData({
        ...threadData,
        id: threadId,
        threadId: threadId, // Explicitly include threadId for header actions
        // Ensure we have sensible defaults for required fields
        participantName: threadData.participantName || 'User',
        source: threadData.source || 'instagram',
      })
    } else if (threads && Array.isArray(threads)) {
      // Find thread data in the threads list
      const selectedThread = (threads as any[]).find(
        (t: any) => t.id === threadId,
      )
      if (selectedThread) {
        setActiveThreadData({
          ...selectedThread,
          threadId: threadId, // Explicitly include threadId for header actions
          // Ensure we have sensible defaults for required fields
          participantName: selectedThread.participantName || 'User',
          source: selectedThread.source || 'instagram',
        })
      }
    }

    // On mobile, hide the thread list when a thread is selected
    if (isMobile) {
      setShowThreadList(false)
    }
  }, [threads, isMobile])

  // Handle back navigation to thread list
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack()
    } else {
      // Fallback behavior
      setActiveThreadId(null)
      setActiveThreadData(null)
      setShowThreadList(true)
      // Clear conversation data when returning to thread list
      if (onConversationDataChange) {
        onConversationDataChange(null)
      }
    }
  }, [onBack, onConversationDataChange])

  // No explicit back/delete actions when headers hidden

  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  })
  const handleGenerateBatch = useCallback(() => {
    fetch('/api/test/generate-batch', { method: 'POST' })
      .then(res => {
        if (!res.ok) {
          return res.text().then(t => { throw new Error(`Server error: ${t}`); });
        }
        return res.json();
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/instagram/messages'] });
        queryClient.invalidateQueries({ queryKey: ['/api/youtube/messages'] });
        queryClient.invalidateQueries({ queryKey: ['/api/threads'] });
        toast({ title: 'Batch generated', description: '10 messages created' });
      })
      .catch(err => {
        console.error('Batch error:', err);
        toast({ title: 'Error', description: String(err), variant: 'destructive' });
      });
  }, [queryClient, toast])

  // Keep active thread data in sync when thread list updates
  useEffect(() => {
    if (!activeThreadId || !threads || !Array.isArray(threads)) return
    const t = (threads as any[]).find((thr: any) => thr.id === activeThreadId)
    if (t) {
      setActiveThreadData({
        ...t,
        participantName: t.participantName || 'User',
        source: t.source || 'instagram',
      })
    }
  }, [activeThreadId, threads])

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <SearchX className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            Couldn't load conversations
          </h3>
          <p className="text-gray-500 max-w-md">
            There was a problem loading your conversations. Please try
            refreshing the page.
          </p>
        </div>
      )
    }

    // Automatically select the first thread only on initial load
    if (
      !hasSelectedThread &&
      !activeThreadId &&
      threads &&
      Array.isArray(threads) &&
      threads.length > 0
    ) {
      setTimeout(() => {
        const firstThread = threads[0]
        if (firstThread?.id) {
          setActiveThreadId(firstThread.id)
          setHasSelectedThread(true)
        }
      }, 0)
    }

    // Mobile view - show either thread list or conversation based on showThreadList state
    if (isMobile) {
      return (
        <div className="h-full flex flex-col">
          {showThreadList ? (
            <div className="flex-1">
              <ThreadList
                activeThreadId={activeThreadId}
                onSelectThread={handleThreadSelect}
                source={activeTab}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              {activeThreadId && (
                <ConversationThread
                  threadId={activeThreadId}
                  threadData={activeThreadData}
                  showBackButton={false}
                  onDeleted={() => {
                    setActiveThreadId(null)
                    setActiveThreadData(null)
                  }}
                />
              )}
            </div>
          )}
        </div>
      )
    }

    // Desktop view - always show split view with resizable panels
    if (activeThreadId) {
      return (
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Thread list */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-white">
            <ThreadList
              activeThreadId={activeThreadId}
              onSelectThread={handleThreadSelect}
              source={activeTab}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Conversation thread */}
          <ResizablePanel defaultSize={75} minSize={50}>
            <ConversationThread
              threadId={activeThreadId}
              threadData={activeThreadData}
              showBackButton={false}
              onDeleted={() => {
                setActiveThreadId(null)
                setActiveThreadData(null)
              }}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      )
    }

    return (
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Thread list */}
        <ResizablePanel 
          defaultSize={25} 
          minSize={20} 
          maxSize={50}
          className="bg-white"
        >
          <ThreadList
            activeThreadId={activeThreadId}
            onSelectThread={handleThreadSelect}
            source={activeTab}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Conversation thread or placeholder */}
        <ResizablePanel defaultSize={75} minSize={50}>
          {activeThreadId ? (
            <ConversationThread
              threadId={activeThreadId}
              threadData={activeThreadData}
              showBackButton={false}
              onDeleted={() => {
                setActiveThreadId(null)
                setActiveThreadData(null)
              }}
            />
          ) : (
            <div className="flex items-center justify-center text-center p-4 h-full">
              <div>
                <h3 className="text-lg font-medium mb-2">
                  No conversation selected
                </h3>
                <p className="text-sm text-gray-500">
                  Select a conversation from the list to view messages
                </p>
              </div>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  return (
    <div
      className={`h-full flex flex-col bg-gray-50 md:pt-0 ${
        isMobile ? 'pt-16' : 'pt-0'
      }`}
    >
      <div className="hidden md:block p-4 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <div className="flex items-center space-x-2" />
          <div className="flex items-center space-x-2">
            {/* Generate Batch Messages Button */}
            <Button
              onClick={handleGenerateBatch}
              size="sm"
              variant="outline"
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              Generate Batch Messages
            </Button>
          </div>
        </div>
        {/* Desktop tabs */}
        <div className="hidden md:block">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(
                value as 'all' | 'instagram' | 'youtube' | 'high-intent',
              )
            }
            className="mt-4"
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
              <TabsTrigger value="high-intent">High Intent</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
     
        {/* Mobile filter dropdown */}
        {showThreadList && (
          <div className="md:hidden mt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-gray-200 hover:bg-gray-300 text-black border border-gray-300"
                >
                  <span>
                    {activeTab === 'all'
                      ? 'All Messages'
                      : activeTab === 'instagram'
                        ? 'Instagram'
                        : 'YouTube'}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                <DropdownMenuItem
                  onClick={() => setActiveTab('all')}
                  className={activeTab === 'all' ? 'bg-gray-100' : ''}
                >
                  All Messages
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setActiveTab('instagram')}
                  className={activeTab === 'instagram' ? 'bg-gray-100' : ''}
                >
                  Instagram
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setActiveTab('youtube')}
                  className={activeTab === 'youtube' ? 'bg-gray-100' : ''}
                >
                  YouTube
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setActiveTab('high-intent')}
                  className={activeTab === 'high-intent' ? 'bg-gray-100' : ''}
                >
                  High Intent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  )
}

export default ThreadedMessages
