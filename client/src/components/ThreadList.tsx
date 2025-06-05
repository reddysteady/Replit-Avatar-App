import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Instagram, Youtube, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ThreadType } from '@shared/schema';

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
  
  // Filter threads by source and search term
  const filteredThreads = React.useMemo(() => {
    if (!threads) return [];
    
    return Array.isArray(threads) ? threads
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
  }, [threads, source, searchTerm]);
  
  // Function to get source icon
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'instagram':
        return <Instagram className="h-4 w-4 mr-1" />;
      case 'youtube':
        return <Youtube className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return "Unknown time";
    }
  };

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
            <div
              key={thread.id}
              className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                activeThreadId === thread.id ? 'bg-gray-100' : ''
              }`}
              onClick={() => onSelectThread(thread.id, thread)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className={`h-10 w-10 mr-3 ${thread?.isHighIntent ? 'ring-2 ring-amber-500' : ''}`}>
                      <AvatarImage 
                        src={thread?.participantAvatar} 
                        alt={thread?.participantName || 'User'} 
                      />
                      <AvatarFallback>{(thread?.participantName || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <div className="font-medium text-sm flex items-center">
                        <span className="truncate">{thread?.participantName || 'User'}</span>
                        <span className="flex items-center text-xs text-gray-500 ml-2">
                          {getSourceIcon(thread?.source || '')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {formatTimestamp(thread?.lastMessageAt || new Date().toISOString())}
                      </p>
                    </div>
                  </div>
                  {thread?.unreadCount && thread.unreadCount > 0 && (
                    <Badge className="bg-blue-500 text-white">{thread.unreadCount}</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {thread?.lastMessageContent || 'No messages yet'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ThreadList;