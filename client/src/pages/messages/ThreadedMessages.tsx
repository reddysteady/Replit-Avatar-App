import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Loader2, SearchX, ChevronDown, ArrowLeft } from 'lucide-react';

const ThreadedMessages: React.FC = () => {
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'instagram' | 'youtube' | 'high-intent'>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [showThreadList, setShowThreadList] = useState(true);
  
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
  const [activeThreadData, setActiveThreadData] = useState(null);

  // Handle thread selection
  const handleThreadSelect = (threadId: number, threadData: any = null) => {
    setActiveThreadId(threadId);
    
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
    
    // No active thread selected yet
    if (!activeThreadId && threads && Array.isArray(threads) && threads.length > 0) {
      // Automatically select the first thread
      setTimeout(() => setActiveThreadId(threads[0]?.id), 0);
    }
    
    // Mobile view - show either thread list or conversation based on showThreadList state
    if (isMobile) {
      return (
        <div className="h-full">
          {showThreadList ? (
            // Thread list view for mobile
            <div className="h-full">
              <ThreadList 
                activeThreadId={activeThreadId} 
                onSelectThread={handleThreadSelect}
                source={activeTab}
              />
            </div>
          ) : (
            // Conversation view for mobile with back button
            <div className="h-full flex flex-col">
              <div className="px-4 py-2 border-b flex items-center sticky top-0 bg-white z-10">
                <Button 
                  variant="default"
                  size="sm" 
                  className="bg-gray-800 hover:bg-gray-900 text-white mr-3"
                  onClick={handleBackClick}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Threads
                </Button>
                <h2 className="font-semibold">Conversation</h2>
              </div>
              <div className="flex-1 overflow-auto">
                {activeThreadId && (
                  <ConversationThread 
                    threadId={activeThreadId}
                    threadData={activeThreadData}
                    showBackButton={false}
                  />
                )}
              </div>
            </div>
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
            <ConversationThread threadId={activeThreadId} />
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
        <h1 className="text-2xl font-bold">Messages</h1>
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
      </div>
      
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default ThreadedMessages;