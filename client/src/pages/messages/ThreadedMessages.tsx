// See CHANGELOG.md for notes up to 2025-06-17
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import ThreadList from '@/components/ThreadList';
import ConversationThread from '@/components/ConversationThread';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

import { Loader2, SearchX, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ChatHeader from '@/components/layout/ChatHeader';

import { ThreadType, Settings } from '@shared/schema';

/* -------------------------------------------------------------------- */
/*  Tab metadata (one source of truth)                                  */
/* -------------------------------------------------------------------- */
export type ThreadSource =
  | 'all'
  | 'instagram'
  | 'youtube'
  | 'high-intent'
  | 'unread'
  | 'archived'
  | 'requires-escalation';

const TABS: { value: ThreadSource; label: string }[] = [
  { value: 'all',                 label: 'All Messages' },
  { value: 'instagram',           label: 'Instagram'    },
  { value: 'youtube',             label: 'YouTube'      },
  { value: 'high-intent',         label: 'High Intent'  },
  { value: 'unread',              label: 'Unread'       },
  { value: 'requires-escalation', label: 'Escalations'  },
  { value: 'archived',            label: 'Archived'     },
];

/* -------------------------------------------------------------------- */
/*  Component                                                           */
/* -------------------------------------------------------------------- */
interface ThreadedMessagesProps {
  onConversationDataChange?: (
    data:
      | {
          participantName?: string;
          participantAvatar?: string;
          platform?: string;
          threadId?: number;
          onBack?: () => void;
        }
      | null,
  ) => void;
  onBack?: () => void;
}

const ThreadedMessages: React.FC<ThreadedMessagesProps> = ({
  onConversationDataChange,
  onBack,
}) => {
  /* ---------------- state ---------------- */
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [activeThreadData, setActiveThreadData] = useState<ThreadType | null>(
    null,
  );
  const [hasSelectedThread, setHasSelectedThread] = useState(false);

  const [activeTab, setActiveTab] = useState<ThreadSource>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [showThreadList, setShowThreadList] = useState(true);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  /* ---------------- helpers ---------------- */
  const handleGenerateBatch = useCallback(() => {
    fetch('/api/test/generate-batch', { method: 'POST' })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((t) => {
            throw new Error(`Server error: ${t}`);
          });
        }
        return res.json();
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/threads'] });
        toast({
          title: 'Batch generated',
          description: '10 messages created',
        });
      })
      .catch((err) => {
        console.error('Batch error:', err);
        toast({
          title: 'Error',
          description: String(err),
          variant: 'destructive',
        });
      });
  }, [queryClient, toast]);

  /* ---------------- queries ---------------- */
  const {
    data: threads,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/threads'],
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });

  /* ---------------- effects ---------------- */
  // Track viewport width
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Toggle thread list vis on mobile
  useEffect(() => {
    if (!isMobile) {
      setShowThreadList(true);
      return;
    }
    setShowThreadList(!activeThreadId);
  }, [isMobile, activeThreadId]);

  // Bubble up conversation meta (used by MobileHeader)
  useEffect(() => {
    if (!onConversationDataChange) return;

    if (activeThreadId && activeThreadData) {
      onConversationDataChange({
        participantName: activeThreadData.participantName,
        participantAvatar: activeThreadData.participantAvatar,
        platform: activeThreadData.source,
        threadId: activeThreadId,
        onBack: handleBack,
      });
    } else {
      onConversationDataChange(null);
    }
  }, [activeThreadId, activeThreadData, onConversationDataChange]);

  // Keep active thread data fresh when list refetches
  useEffect(() => {
    if (!activeThreadId || !threads || !Array.isArray(threads)) return;
    const t = (threads as ThreadType[]).find((thr) => thr.id === activeThreadId);
    if (t) setActiveThreadData(t);
  }, [threads, activeThreadId]);

  /* ---------------- callbacks ---------------- */
  const handleThreadSelect = useCallback(
    (threadId: number, threadData?: ThreadType) => {
      setActiveThreadId(threadId);
      setHasSelectedThread(true);
      setActiveThreadData(threadData || null);
      if (isMobile) setShowThreadList(false);
    },
    [isMobile],
  );

  const handleBack = useCallback(() => {
    if (onBack) return onBack();
    setActiveThreadId(null);
    setActiveThreadData(null);
    setShowThreadList(true);
  }, [onBack]);

  /* ---------------- render helpers ---------------- */
  const renderContent = () => {
    /* loading / error */
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <SearchX className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            Couldn't load conversations
          </h3>
          <p className="text-gray-500 max-w-md">
            Please refresh the page and try again.
          </p>
        </div>
      );
    }

    /* mobile */
    if (isMobile) {
      return (
        <div className="h-full flex flex-col">
          {showThreadList ? (
            <ThreadList
              activeThreadId={activeThreadId}
              onSelectThread={handleThreadSelect}
              source={activeTab}
            />
          ) : (
            activeThreadId && (
              <ConversationThread
                threadId={activeThreadId}
                threadData={activeThreadData}
                showBackButton={false}
                onDeleted={() => {
                  setActiveThreadId(null);
                  setActiveThreadData(null);
                }}
              />
            )
          )}
        </div>
      );
    }

    /* desktop */
    const threadListPanel = (
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
    );

    const conversationPanel = (
      <ResizablePanel defaultSize={75} minSize={50}>
        {activeThreadId ? (
          <ConversationThread
            threadId={activeThreadId}
            threadData={activeThreadData}
            showBackButton={false}
            onDeleted={() => {
              setActiveThreadId(null);
              setActiveThreadData(null);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
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
    );

    return (
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {threadListPanel}
        <ResizableHandle withHandle />
        {conversationPanel}
      </ResizablePanelGroup>
    );
  };

  /* ---------------- JSX ---------------- */
  return (
    <div
      className={`h-full flex flex-col bg-gray-50 ${
        isMobile ? 'pt-16' : 'pt-0'
      }`}
    >
      {/* Desktop header */}
      <div className="hidden md:block p-4 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <Button
            size="sm"
            variant="outline"
            className="bg-gray-900 text-white hover:bg-gray-800"
            onClick={handleGenerateBatch}
          >
            Generate Batch Messages
          </Button>
        </div>

        {/* Desktop tab strip */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ThreadSource)}
        >
          <TabsList>
            {TABS.map(({ value, label }) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Mobile filter dropdown */}
      {showThreadList && isMobile && (
        <div className="md:hidden mt-4 px-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between bg-gray-200 hover:bg-gray-300 text-black border border-gray-300"
              >
                <span>
                  {TABS.find((t) => t.value === activeTab)?.label || 'Filter'}
                </span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent sideOffset={4} className="w-full">
              {TABS.map(({ value, label }) => (
                <DropdownMenuItem
                  key={value}
                  onSelect={() => setActiveTab(value)}
                  className={value === activeTab ? 'bg-gray-100' : ''}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
};

export default ThreadedMessages;
