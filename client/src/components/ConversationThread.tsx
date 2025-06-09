// See CHANGELOG.md for 2025-06-11 [Added]
// See CHANGELOG.md for 2025-06-10 [Added]
// See CHANGELOG.md for 2025-06-10 [Fixed]
// See CHANGELOG.md for 2025-06-09 [Fixed]
// ===== client/src/components/ConversationThread.tsx =====
// See CHANGELOG.md for 2025-06-08 [Fixed]
// See CHANGELOG.md for 2025-06-08 [Added]
import React, { useRef, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMessageThreading, ThreadedMessageType } from '@/hooks/useMessageThreading';
import { MessageType, ThreadType } from '@shared/schema';
import { Loader2, Send, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { log } from '@/lib/logger';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

interface ConversationThreadProps {
  threadId?: number;
  threadData?: any;
  messages?: MessageType[];
  showBackButton?: boolean;
  onBack?: () => void;
  onDeleted?: () => void;
}

// Recursive renderer for threaded messages
function ThreadedMessage({ msg, threadId, setShowMobileActions }: { msg: ThreadedMessageType; threadId: number; setShowMobileActions: React.Dispatch<React.SetStateAction<{ id: number; onReply: () => void; onDelete: () => void } | null>> }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const { mutate: deleteMessage } = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/messages/${id}`, {}),
    onSuccess: (_, id) => {
      queryClient.setQueryData<MessageType[]>(
        ['thread-messages', threadId],
        (old) => old?.filter((m) => m.id !== id) || []
      );
      toast({ title: 'Message deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete message', variant: 'destructive' });
    }
  });
  const { mutate: postReply } = useMutation({
    mutationFn: (payload: { content: string; parentMessageId: number | null }) =>
      apiRequest('POST', `/api/threads/${msg.threadId}/reply`, payload).then(res => res.json()),
  });
  
  // Display default avatar if none provided
  const avatarUrl = msg.sender?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(msg.sender?.name || 'User');
  
  // Handle reply submission
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    postReply({ content: replyText, parentMessageId: msg.id });

    // Reset form
    setReplyText('');
    setIsReplying(false);
  };

  const handleDelete = () => deleteMessage(msg.id);

  const startHold = () => {
    if (!isMobile) return;
    holdTimer.current = setTimeout(() => {
      setShowMobileActions({ id: msg.id, onReply: () => setIsReplying(true), onDelete: handleDelete });
    }, 500);
  };

  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };
  
  return (
    <div style={{ paddingLeft: msg.depth * 20 }} className="mb-4 relative">
      {/* Vertical line connecting replies */}
      {msg.depth > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 border-l-2 border-gray-200" 
          style={{ left: (msg.depth * 20) - 10 + 'px' }}
        />
      )}
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
        <div className="flex items-start">
          <img
            src={avatarUrl}
            alt={msg.sender?.name || 'User'}
            className="w-8 h-8 rounded-full mr-2"
          />
          <div className="flex-1">
            <div className="text-sm font-semibold">{msg.sender?.name || 'User'}</div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</div>
            <div className="flex justify-between items-center mt-1" onTouchStart={startHold} onTouchEnd={cancelHold}>
              <div className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</div>
              {!isMobile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => setIsReplying(true)}>Reply</DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleDelete}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {/* Reply form */}
            {isReplying && (
              <form onSubmit={handleReplySubmit} className="mt-2">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsReplying(false)}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    <Send className="h-3 w-3 mr-1" />
                    Send
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      
      {/* Render child messages */}
      {msg.childMessages.length > 0 && (
        <div className="mt-2">
          {msg.childMessages.map(child => (
            <ThreadedMessage key={child.id} msg={child} threadId={threadId} setShowMobileActions={setShowMobileActions} />
          ))}
        </div>
      )}
    </div>
  );
}

const ConversationThread: React.FC<ConversationThreadProps> = ({
  threadId,
  threadData,
  messages: propMessages,
  showBackButton = false,
  onBack,
  onDeleted
}) => {
  const [replyText, setReplyText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [showMobileActions, setShowMobileActions] = useState<{ id: number; onReply: () => void; onDelete: () => void } | null>(null);
  const { mutate: postMessage } = useMutation({
    mutationFn: (payload: { content: string; parentMessageId: number | null }) =>
      apiRequest('POST', `/api/threads/${threadId}/reply`, payload).then(res => res.json()),
  });

  const { mutate: deleteThread } = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/threads/${threadId}`, {}),
    onSuccess: () => {
      queryClient.setQueryData<ThreadType[]>(
        ['/api/threads'],
        (old) => old?.filter((t) => t.id !== threadId) || []
      );
      queryClient.invalidateQueries({ queryKey: ['/api/threads'] });

      toast({ title: 'Thread deleted' });
      onDeleted?.();
    },
    onError: () => {
      toast({ title: 'Failed to delete thread', variant: 'destructive' });
    }
  });
  
  // Fetch flat messages for the thread and build the threaded hierarchy on the client
  const {
    data: fetchedMessages,
    isLoading,
    error
  } = useQuery({
    queryKey: ['thread-messages', threadId],
    queryFn: async () => {
      if (!threadId) return [];
      const response = await fetch(`/api/threads/${threadId}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch thread messages');
      }
      return response.json();
    },
    enabled: !!threadId && !propMessages,
    refetchInterval: 5000,
  });

  // Use messages from props if available, otherwise thread the fetched messages
  const finalMessages = propMessages
    ? useMessageThreading(propMessages).threadedMessages
    : useMessageThreading(fetchedMessages).threadedMessages;
  

  // Stringify metadata for logging to match logger signature
  log(
    "Message render triggered " +
      JSON.stringify({
        messagesLoaded: finalMessages ? finalMessages.length : 0,
        threadId,
        fetchedCount: fetchedMessages ? fetchedMessages.length : 0,
      })
  );
  
  if (finalMessages && finalMessages.length > 0) {
    log("Rendering Thread #" + threadId + " with enhanced conversation threading");
    log(
      "Top-level threaded messages: " +
        JSON.stringify(
          finalMessages.map((m) => ({ id: m.id, hasChildren: m.childMessages.length }))
        )
    );
  }

  // Scroll to bottom on new messages
  useEffect(() => {
    if (finalMessages && finalMessages.length > 0) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [finalMessages]);
  
  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !threadId) return;

    try {
      // parentMessageId of 0 caused server-side issues; see CHANGELOG.md for 2025-06-08 [Fixed]
      postMessage({ content: replyText, parentMessageId: null });

      // Reset form
      setReplyText('');
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleComposerKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      if (replyText.trim()) {
        handleSendMessage(e as unknown as React.FormEvent);
      }
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
          <p className="text-gray-500">Loading conversation...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-medium mb-2">Error loading conversation</h3>
          <p className="text-red-700">
            There was a problem loading this conversation. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Thread header with participant info */}
      {threadData && (
        <div className="px-4 py-3 border-b flex items-center bg-white">
          {showBackButton && onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              ←
            </Button>
          )}
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full mr-3 flex-shrink-0 overflow-hidden ring-2 ${
                threadData.isHighIntent ? 'ring-orange-500' : 'ring-gray-300'
              } bg-gray-200`}
            >
              {threadData.participantAvatar ? (
                <img
                  src={threadData.participantAvatar}
                  alt={threadData.participantName}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                  {threadData.participantName.substring(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium">{threadData.participantName}</h3>
              <div className="text-xs text-gray-500 flex items-center">
                <span className="capitalize">{threadData.source}</span>
                {threadData.isHighIntent && (
                  <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                    High Intent
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => deleteThread()}>Delete Thread</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {isMobile && showMobileActions && (
        <div className="fixed top-0 left-0 right-0 bg-white border-b z-20 flex justify-end space-x-2 p-2">
          <Button size="sm" variant="ghost" onClick={() => { showMobileActions.onReply(); setShowMobileActions(null); }}>
            Reply
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { showMobileActions.onDelete(); setShowMobileActions(null); }}>
            Delete
          </Button>
        </div>
      )}
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {!finalMessages || finalMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages in this conversation yet.</p>
          </div>
        ) : (
          <>
            {finalMessages.map(root => (
              <ThreadedMessage key={root.id} msg={root} threadId={threadId!} setShowMobileActions={setShowMobileActions} />
            ))}
          </>
        )}
        <div ref={endRef} />
      </div>
      
      {/* Reply form */}
      <div className="p-3 border-t bg-white">
        <form onSubmit={handleSendMessage} className="flex">
          <Textarea
            aria-label="Message input"
            placeholder="Type your message..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleComposerKeyDown}
            className="flex-1 min-h-[60px] resize-none"
          />
          <Button
            type="submit"
            className="ml-2 self-end"
            disabled={!replyText.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <div className="text-xs text-gray-500 mt-1">
          Press Enter to send • Shift + Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ConversationThread;