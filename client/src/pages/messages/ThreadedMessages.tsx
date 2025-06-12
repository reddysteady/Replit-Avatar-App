// See CHANGELOG.md for 2025-06-11 [Added]
// See CHANGELOG.md for 2025-06-12 [Fixed]
// See CHANGELOG.md for 2025-06-09 [Changed]
// See CHANGELOG.md for 2025-06-09 [Changed - dropdown alignment]
// See CHANGELOG.md for 2025-06-09 [Changed - thread dropdown]
// See CHANGELOG.md for 2025-06-10 [Fixed - batch invalidation keys]
// See CHANGELOG.md for 2025-06-10 [Added]
// See CHANGELOG.md for 2025-06-10 [Fixed - hide mobile filter dropdown in conversation view]
// See CHANGELOG.md for 2025-06-12 [Changed - mobile header integrates menu]
// See CHANGELOG.md for 2025-06-12 [Changed - show ChatHeader only in conversation view]
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ThreadList from '@/components/ThreadList';
import ConversationThread from '@/components/ConversationThread';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, SearchX, ChevronDown, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


import ChatHeader from '@/components/layout/ChatHeader';
import MobileHeader from '@/components/layout/MobileHeader';
import { ThreadType } from '@shared/schema';

const ThreadedMessages: React.FC = () => {
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [hasSelectedThread, setHasSelectedThread] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'instagram' | 'youtube' | 'high-intent'>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [showThreadList, setShowThreadList] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check for mobile view on mount and on resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // On mobile, if a thread is active, hide the thread list
      if (mobile && activeThreadId) {
        setShowThreadList(false);
      } else {
        setShowThreadList(true);
      }
    };
    
    // Check initially
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, [activeThreadId]);
  
  // Get active thread info
  const [activeThreadData, setActiveThreadData] = useState<ThreadType | null>(null);

  // Handle thread selection
  const handleThreadSelect = (threadId: number, threadData: any = null) => {
    setActiveThreadId(threadId);
    setHasSelectedThread(true);
    
    // Store thread data for consistent profile rendering
    if (threadData) {
      // Make sure we capture all thread data for profile display
      setActiveThreadData({
        ...threadData,
        id: threadId,
        // Ensure we have sensible defaults for required fields
        participantName: threadData.participantName || "User",
        source: threadData.source || "instagram"
      });
    } else if (threads) {
      // Find thread data in the threads list
      const selectedThread = (threads as any[]).find((t: any) => t.id === threadId);
      if (selectedThread) {
        setActiveThreadData({
          ...selectedThread,
          // Ensure we have sensible defaults for required fields
          participantName: selectedThread.participantName || "User",
          source: selectedThread.source || "instagram"
        });
      }
    }
    
    // On mobile, hide the thread list when a thread is selected
    if (isMobile) {
      setShowThreadList(false);
    }
  };
  
  // Handle back button click
  const handleBackClick = () => {
    if (isMobile) {
      setShowThreadList(true);
    }
  };

  const handleDeleteThread = async () => {
    if (!activeThreadId) return;
    try {
      const res = await fetch(`/api/threads/${activeThreadId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      queryClient.setQueryData<ThreadType[]>(['/api/threads'], (old) => old?.filter(t => t.id !== activeThreadId) || []);
      queryClient.invalidateQueries({ queryKey: ['/api/threads'] });
      toast({ title: 'Thread deleted' });
      setActiveThreadId(null);
      setActiveThreadData(null);
    } catch {
      toast({ title: 'Failed to delete thread', variant: 'destructive' });
    }
  };
  
  // Check for empty threads
  const { data: threads, isLoading, error } = useQuery({
    queryKey: ['/api/threads'],
    staleTime: 10000,
  });
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <SearchX className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">Couldn't load conversations</h3>
          <p className="text-gray-500 max-w-md">
            There was a problem loading your conversations. Please try refreshing the page.
          </p>
        </div>
      );
    }
    
    // Automatically select the first thread only on initial load
    if (!hasSelectedThread && !activeThreadId && threads && Array.isArray(threads) && threads.length > 0) {
      setTimeout(() => {
        setActiveThreadId(threads[0]?.id);
        setHasSelectedThread(true);
      }, 0);
    }
    
    // Mobile view - show either thread list or conversation based on showThreadList state
    if (isMobile) {
      return (
        <div className="h-full flex flex-col">
          {showThreadList ? (
            <>
              <MobileHeader />
              <div className="flex-1 pt-16">
                <ThreadList
                  activeThreadId={activeThreadId}
                  onSelectThread={handleThreadSelect}
                  source={activeTab}
                />
              </div>
            </>
          ) : (
            <>
              <ChatHeader
                name={activeThreadData?.participantName || 'Conversation'}
                avatarUrl={activeThreadData?.participantAvatar || ''}
                platform={activeThreadData?.source || ''}
                onBack={handleBackClick}
                onDeleteThread={handleDeleteThread}
              />
              <div className="flex-1 overflow-auto">
                {activeThreadId && (
                  <ConversationThread
                    threadId={activeThreadId}
                    threadData={activeThreadData}
                    showBackButton={false}
                    onDeleted={() => {
                      setActiveThreadId(null);
                      setActiveThreadData(null);
                    }}
                  />
                )}
              </div>
            </>
          )}
        </div>
      );
    }
    
    // Desktop view - always show split view
    if (activeThreadId) {
      return (
        <div className="h-full flex">
          {/* Thread list */}
          <div className="md:w-1/3 lg:w-1/4 h-full border-r border-gray-200 bg-white">
            <ThreadList 
              activeThreadId={activeThreadId} 
              onSelectThread={handleThreadSelect}
              source={activeTab}
            />
          </div>
          
          {/* Conversation thread */}
          <div className="md:w-2/3 lg:w-3/4 h-full">
          <ConversationThread
            threadId={activeThreadId}
            threadData={activeThreadData}
            showBackButton={false}
            onDeleted={() => {
              setActiveThreadId(null);
              setActiveThreadData(null);
            }}
          />
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex h-full">
        {/* Thread list */}
        <div className={`${activeThreadId ? 'hidden md:block' : 'w-full'} md:w-1/3 lg:w-1/4 h-full border-r border-gray-200 bg-white`}>
          <ThreadList 
            activeThreadId={activeThreadId} 
            onSelectThread={handleThreadSelect}
            source={activeTab}
          />
        </div>
        
        {/* Conversation thread */}
        <div className="hidden md:block md:w-2/3 lg:w-3/4 h-full">
          {activeThreadId ? (
            <ConversationThread
              threadId={activeThreadId}
              onDeleted={() => {
                setActiveThreadId(null);
                setActiveThreadData(null);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-center p-4">
              <div>
                <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
                <p className="text-sm text-gray-500">
                  Select a conversation from the list to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <div className="flex items-center space-x-2"></div>
        </div>
        {/* Desktop tabs */}
        <div className="hidden md:block">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'all' | 'instagram' | 'youtube' | 'high-intent')}
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
              <Button variant="outline" className="w-full justify-between bg-gray-200 hover:bg-gray-300 text-black border border-gray-300">
                <span>
                  {activeTab === 'all' ? 'All Messages' :
                   activeTab === 'instagram' ? 'Instagram' : 'YouTube'}
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
      
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default ThreadedMessages;