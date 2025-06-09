// See CHANGELOG.md for 2025-06-10 [Added]
// See CHANGELOG.md for 2025-06-10 [Fixed]
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ThreadRow from './ThreadRow';
import { Search } from 'lucide-react';
import { ThreadType } from '@shared/schema';
import { sampleConversations } from '@/sampleConversations';

interface ThreadListProps {
  activeThreadId?: number | null;
  onSelectThread: (threadId: number, threadData?: any) => void;
  source?: 'all' | 'instagram' | 'youtube' | 'high-intent';
}

const ThreadList: React.FC<ThreadListProps> = ({ 
  activeThreadId, 
  onSelectThread,
  source = 'all'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch threads from API
  const { data: threads, isLoading } = useQuery({
    queryKey: ['/api/threads'],
    staleTime: 10000, // 10 seconds
  });

  // Use sample conversations when the API returns an empty list
  const threadsData: ThreadType[] | undefined =
    threads && Array.isArray(threads) && threads.length > 0
      ? (threads as ThreadType[])
      : sampleConversations;
  
  // Filter threads by source and search term
  const filteredThreads = React.useMemo(() => {
    if (!threadsData) return [];

    return Array.isArray(threadsData) ? threadsData
      .filter((thread: ThreadType) => {
        // Filter by source or high intent
        if (source === 'high-intent' && !thread?.isHighIntent) {
          return false;
        } else if (source !== 'all' && source !== 'high-intent' && thread?.source !== source) {
          return false;
        }
        
        // Filter by search term
        if (searchTerm && thread?.participantName) {
          return thread.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 (thread.lastMessageContent && 
                  thread.lastMessageContent.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        return true;
      }) : []
      .sort((a: ThreadType, b: ThreadType) => {
        // Sort by last message date (newest first)
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
  }, [threadsData, source, searchTerm]);
  

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
            {searchTerm ? 'No matching conversations found' : 'No conversations yet'}
          </div>
        ) : (
          filteredThreads.map((thread: ThreadType) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              onClick={() => onSelectThread(thread.id, thread)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ThreadList;