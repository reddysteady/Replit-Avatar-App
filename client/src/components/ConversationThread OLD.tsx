import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SimpleMessage from './SimpleMessage';
import { 
  Instagram, 
  Youtube, 
  Send, 
  ThumbsUp, 
  Loader2,
  AlertCircle,
  MoreHorizontal,
  ArrowLeft,
  Reply,
  MessageCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { MessageType, ThreadType } from '@shared/schema';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface ConversationThreadProps {
  threadId: number;
  threadData?: ThreadType;
  onBack?: () => void;
  showBackButton?: boolean;
}

// Default thread for fallback
const defaultThread: ThreadType = {
  id: 0,
  externalParticipantId: '',
  participantName: 'User',
  source: 'instagram' as 'instagram',
  lastMessageAt: new Date().toISOString(),
  status: 'active' as 'active',
  unreadCount: 0
};

const ConversationThread: React.FC<ConversationThreadProps> = ({ 
  threadId, 
  threadData, 
  onBack, 
  showBackButton 
}) => {
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch thread info
  const { data: thread, isLoading: isLoadingThread } = useQuery({
    queryKey: ['/api/threads', threadId],
    enabled: !!threadId
  });

  // Fetch messages in thread with improved error handling and data transformation
  const { 
    data: messages, 
    isLoading: isLoadingMessages,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['/api/threads', threadId, 'messages'],
    enabled: !!threadId,
    refetchInterval: 2000, // Refresh messages every 2 seconds to catch new replies
    select: (data) => {
      if (!data || !Array.isArray(data)) {
        console.error("Invalid message data received:", data);
        return [];
      }

      // Check if messages exist and log for debugging
      console.log(`Loaded ${data.length} messages for thread ID ${threadId}`);
      data.forEach(msg => {
        console.log(`Message ${msg.id}: ${msg.content?.substring(0, 30) || '(empty)'}...`);
      });

      return data;
    }
  });

  // Reply mutation
  const { 
    mutate: sendReply, 
    isPending: isSendingReply 
  } = useMutation({
    mutationFn: async (data: { content: string, parentMessageId?: number }) => {
      return apiRequest('POST', `/api/threads/${threadId}/reply`, data);
    },
    onSuccess: () => {
      setReplyText('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['/api/threads', threadId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/threads'] });
      toast({
        title: "Reply sent!",
        description: "Your reply has been sent successfully.",
      });
    },
    onError: (err) => {
      console.error("Error sending reply:", err);
      toast({
        title: "Error sending reply",
        description: "There was an error sending your reply. Please try again.",
        variant: "destructive",
      });
    }
  });

  // AI Generate reply mutation
  const {
    mutate: generateReply,
    isPending: isGeneratingReply
  } = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/threads/${threadId}/generate-reply`, {});
    },
    onSuccess: (response) => {
      if (response.ok) {
        response.json().then(data => {
          setReplyText(data.reply || '');
        });
      }
      setIsGenerating(false);
    },
    onError: (err) => {
      console.error("Error generating reply:", err);
      toast({
        title: "Error generating reply",
        description: "There was an error generating an AI reply. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark thread as read when opened
  useEffect(() => {
    if (threadId) {
      apiRequest('POST', `/api/threads/${threadId}/read`, {});
    }
  }, [threadId]);

  const handleSendReply = () => {
    if (!replyText.trim()) return;

    // Make sure the parentMessageId is a number if it exists
    // This is critical for database operations
    let parentId = undefined;
    
    if (replyingTo) {
      parentId = Number(replyingTo);
      console.log(`Replying to message ID: ${parentId} (converted from ${replyingTo})`);
    }
    
    const payload = {
      content: replyText,
      parentMessageId: parentId
    };

    console.log("Sending reply with payload:", payload);

    // Send the reply and actively monitor for success
    sendReply(payload);
    
    // Clear the input field and reset UI
    setReplyText("");
    setReplyingTo(null);

    // Use multiple refetch attempts to ensure we get the latest messages
    // This helps overcome any potential race conditions or caching issues
    const refetchWithRetry = () => {
      console.log("Refetching messages after reply...");
      refetchMessages().then(() => {
        console.log("Messages refetched successfully");
      });

      // Do additional refetches to ensure we catch any delayed database updates
      setTimeout(() => refetchMessages(), 1000);
      setTimeout(() => refetchMessages(), 2500);
    };

    // Start refetching soon after sending
    setTimeout(refetchWithRetry, 300);
  };

  const handleGenerateReply = () => {
    setIsGenerating(true);
    generateReply();
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return '(unknown time)';
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Thread header with participant info
  const renderThreadHeader = () => {
    // Use thread data with type-safe fallbacks
    const threadInfo: ThreadType = threadData || (thread as ThreadType) || defaultThread;

    return (
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center">
          {showBackButton && (
            <Button onClick={onBack} variant="ghost" size="sm" className="mr-2 -ml-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <Avatar className="h-8 w-8 mr-2">
            {threadInfo.participantAvatar ? (
              <AvatarImage src={threadInfo.participantAvatar} />
            ) : (
              <AvatarFallback>
                {getSourceIcon(threadInfo.source)}
              </AvatarFallback>
            )}
          </Avatar>

          <div>
            <div className="font-semibold">
              {threadInfo.participantName || 'User'}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              {getSourceIcon(threadInfo.source)}
              <span className="capitalize">{threadInfo.source}</span>
              {threadInfo.lastMessageAt && (
                <span className="ml-1">· {formatTimestamp(threadInfo.lastMessageAt)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center">
          {threadInfo.status === 'active' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
              <DropdownMenuItem>Archive Thread</DropdownMenuItem>
              <DropdownMenuItem>View Profile</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  // Organize messages into a parent-child structure for display
  const getOrganizedMessages = () => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return { parentChildMap: new Map(), topLevelMessages: [] };
    }

    console.log("TROUBLESHOOTING - Raw messages data:", JSON.stringify(messages, null, 2));

    // Map to track parent-child relationships
    const parentChildMap = new Map<number, number[]>();
    // Set to track which messages are replies
    const replyMessageIds = new Set<number>();

    // Build the parent-child relationships with strict type checking
    messages.forEach(message => {
      const parentId = typeof message.parentMessageId === 'string' 
        ? parseInt(message.parentMessageId, 10)
        : message.parentMessageId;

      if (parentId && !isNaN(parentId) && parentId > 0) {
        // This is a reply message
        replyMessageIds.add(message.id);

        // Add this message as a child of its parent
        if (!parentChildMap.has(parentId)) {
          parentChildMap.set(parentId, []);
        }

        const children = parentChildMap.get(parentId);
        if (children) {
          children.push(message.id);
          console.log(`✓ Thread relationship: Message ${message.id} is replying to ${parentId}`);
        }
      } else {
        // This is a top-level message
        console.log(`→ Root message: ${message.id} (no parent)`);
      }
    });

    // Find top-level messages (not replies)
    const topLevelMessages = messages.filter(message => !replyMessageIds.has(message.id))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    console.log("DETAILED THREAD STRUCTURE:", {
      messageCount: messages.length,
      topLevelCount: topLevelMessages.length,
      topLevelIds: topLevelMessages.map(m => m.id),
      replyCount: replyMessageIds.size,
      replyMsgIds: Array.from(replyMessageIds),
      parentChildMap: Object.fromEntries(parentChildMap.entries())
    });

    return { parentChildMap, topLevelMessages };
  };

  // Single message component
  const MessageItem = ({ 
    message, 
    isReply = false,
    onReplyClick
  }: { 
    message: MessageType, 
    isReply?: boolean,
    onReplyClick: (id: number) => void  
  }) => {
    // Use thread data with type-safe fallbacks
    const threadInfo: ThreadType = threadData || (thread as ThreadType) || defaultThread;

    // For consistent display of sender information
    const senderName = message.isOutbound 
      ? "Creator" 
      : (threadInfo.participantName || message.sender?.name || "User");

    const senderAvatar = message.isOutbound 
      ? null 
      : (threadInfo.participantAvatar || message.sender?.avatar);

    return (
      <div className={`w-full p-3 ${isReply ? 'pl-4' : ''}`}>
        <div className={`flex ${message.isOutbound ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`${message.isOutbound ? 'ml-2' : 'mr-2'} flex-shrink-0`}>
            <Avatar className={`h-8 w-8 ${
              message.isHighIntent && !message.isOutbound 
                ? 'border-2 border-orange-400' 
                : ''
            }`}>
              {senderAvatar ? (
                <AvatarImage src={senderAvatar} />
              ) : (
                <AvatarFallback>
                  {message.source === 'instagram' ? <Instagram size={16} /> : <Youtube size={16} />}
                </AvatarFallback>
              )}
            </Avatar>
          </div>

          <div className={`flex-1 ${message.isOutbound ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center mb-1">
              <span className="font-semibold text-sm">{senderName}</span>
              <span className="text-gray-500 text-xs ml-2">
                {formatTimestamp(message.timestamp)}
              </span>
              {message.isHighIntent && !message.isOutbound && (
                <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-800 border-orange-200">
                  High Intent
                </Badge>
              )}
            </div>

            <div className="text-sm whitespace-pre-wrap break-words">
              {message.content || "(No message content)"}
            </div>

            {message.reply && message.reply.length > 0 && (
              <div className="mt-2 bg-gray-50 p-2 rounded-md">
                <div className="flex items-center mb-1">
                  <span className="font-semibold text-xs">Creator</span>
                  {message.isAiGenerated && (
                    <Badge variant="outline" className="ml-2 text-xs">AI Generated</Badge>
                  )}
                </div>
                <div className="text-sm text-gray-800">{message.reply}</div>
              </div>
            )}

            <div className="mt-2 flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs" 
                onClick={() => onReplyClick(message.id)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render messages with parent-child relationships
  const renderMessages = () => {
    // Debug output to track message loading
    console.log("Message render triggered", {
      messagesLoaded: Array.isArray(messages) ? messages.length : 0,
      threadId
    });

    // More robust check for empty messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-slate-600">
          <MessageCircle className="h-16 w-16 text-slate-300 mb-4" />
          <p className="text-lg font-medium mb-2">No messages yet</p>
          <p className="text-sm text-slate-500 text-center max-w-md">
            When messages are added to this conversation, they'll appear here with threaded replies.
          </p>
        </div>
      );
    }

    // Thread #1 - Enhanced conversation threading with special handling for our test thread
    if (threadId === 1) {
      console.log("Rendering Thread #1 with enhanced conversation threading");

      try {
        // Check if we have actual messages to work with
        if (!messages || messages.length === 0) {
          return (
            <div className="flex justify-center items-center h-64">
              <p className="text-slate-500">No messages in this conversation.</p>
            </div>
          );
        }

        // Use the actual messages from the database
        let messagesForThread = [...messages];

        // Add default content for any messages missing content
        messagesForThread = messagesForThread.map(msg => {
          if (!msg.content) {
            console.log(`Adding placeholder content for message ${msg.id}`);
            return {
              ...msg,
              content: `Message from ${msg.isOutbound ? "Creator" : "User"}`,
              sender: msg.sender || {
                id: msg.isOutbound ? "creator-id" : "user-id",
                name: msg.isOutbound ? "Creator" : "User"
              }
            };
          }
          return msg;
        });

        // Log the actual message content we're working with
        console.log("Message content check:", 
          messagesForThread.map(m => ({
            id: m.id, 
            content: m.content?.substring(0, 20) + "...",
            parentId: m.parentMessageId
          }))
        );

        // Log the actual messages we're using to help with debugging
        console.log("Messages being used for rendering:", messagesForThread.map(m => ({
          id: m.id,
          content: (m.content || "").substring(0, 15) + "...",
          parentId: m.parentMessageId
        })));

        // Build the parent-child relationships for message threading
        const parentChildMap = new Map<number, number[]>();
        const replyMessageIds = new Set<number>();

        // Improved handling of parent-child relationships
        messagesForThread.forEach(msg => {
          if (!msg.content) {
            console.warn(`Message ${msg.id} has no content!`);
          }

          // Ensure parentMessageId is a number or null
          let parentId = null;
          
          if (typeof msg.parentMessageId !== 'undefined' && msg.parentMessageId !== null) {
            parentId = Number(msg.parentMessageId);
            if (isNaN(parentId)) {
              parentId = null;
            }
          }

          if (parentId !== null && parentId > 0) {
            // This is a reply message
            replyMessageIds.add(msg.id);

            // Add this message as a child to its parent
            if (!parentChildMap.has(parentId)) {
              parentChildMap.set(parentId, []);
            }
            parentChildMap.get(parentId)?.push(msg.id);
            console.log(`✓ Found reply: Message ${msg.id} is a reply to parent ${parentId}`);
          } else {
            console.log(`→ Top-level: Message ${msg.id}`);
          }
        });
        
        // Double-check our parent-child mappings against the raw database results
        console.log("All parent-child relationships:");
        messagesForThread.forEach(msg => {
          if (msg.parentMessageId) {
            console.log(`DB: Message ${msg.id} has parent ${msg.parentMessageId}`);
          }
        });

        // Sort by timestamp
        const sortedMessages = [...messagesForThread].sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeA - timeB;
        });

        // Find top-level messages (not replies)
        const topLevelMessages = sortedMessages.filter(msg => !replyMessageIds.has(msg.id));
        console.log("Top-Level Messages:", topLevelMessages.map(m => m.id));

        // For debugging, log all available threads
        console.log("All Message IDs:", sortedMessages.map(m => m.id).join(", "));
        console.log("Parent → Child Map:", JSON.stringify(Object.fromEntries(Array.from(parentChildMap.entries())), null, 2));

        // Recursive function to render a message tree
        const renderMessageTree = (message: MessageType, depth: number = 0) => {
          try {
            console.log(`Rendering message ${message.id} at depth ${depth}, content: "${message.content?.substring(0, 20) || '(empty)'}..."`);

            // Find direct children (replies to this message)
            const childIds = parentChildMap.get(message.id) || [];
            const childMessages = messagesForThread
              .filter(msg => childIds.includes(msg.id))
              .sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeA - timeB;
              });

            return (
              <div key={message.id} className="mb-2">
                {/* Current message */}
                <SimpleMessage 
                  message={message}
                  isReply={replyMessageIds.has(message.id)}
                  indent={depth}
                  onReply={setReplyingTo}
                  senderName={message.isOutbound ? "Creator" : message.sender?.name || "User"}
                  senderAvatar={message.isOutbound ? null : message.sender?.avatar}
                />

                {/* Child messages with indentation and visual indicator */}
                {childMessages.length > 0 && (
                  <div className="ml-4 border-l-2 border-blue-100 pl-2">
                    {childMessages.map(childMsg => renderMessageTree(childMsg, depth + 1))}
                  </div>
                )}
              </div>
            );
          } catch (err) {
            console.error("Failed to render message tree for message ID:", message.id, err);
            return (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600">
                Error rendering message {message.id}
              </div>
            );
          }
        };

        return (
          <div className="flex flex-col space-y-2 p-4">
            {topLevelMessages.map(msg => renderMessageTree(msg, 0))}
          </div>
        );
      } catch (err) {
        console.error("Thread rendering error:", err);

        // Fallback to simple flat message display if threading fails
        return (
          <div className="flex flex-col space-y-4 p-4">
            <div className="p-2 bg-yellow-50 border border-yellow-300 rounded mb-2">
              ⚠️ Thread rendering issue detected. Showing messages in flat view.
            </div>
            {messages.map(message => (
              <SimpleMessage
                key={message.id}
                message={{
                  ...message,
                  content: message.content || `Message ID ${message.id} (content unavailable)`
                }}
                isReply={false}
                onReply={setReplyingTo}
                senderName={message.isOutbound ? "Creator" : message.sender?.name || "User"}
                senderAvatar={message.isOutbound ? null : message.sender?.avatar}
              />
            ))}
          </div>
        );
      }
    }

    // Explicitly log all messages with threading details to help debug parent-child relationships
    console.log("Thread messages data with threading info:", 
      messages.map(m => ({
        id: m.id,
        content: m.content?.substring(0, 15),
        parentId: m.parentMessageId,
        isReply: !!m.parentMessageId
      }))
    );

    // Helper to organize the messages into parent-child structure
    const getOrganizedThreadMessages = () => {
      // Map to track parent-child relationships  
      const parentChildMap = new Map<number, number[]>();

      // Set to track which messages are replies
      const replyMessageIds = new Set<number>();

      // CRITICAL FIX - More detailed debug information
      console.log("DEBUGGING PARENT-CHILD RELATIONSHIPS - Raw Message Data:");
      if (Array.isArray(messages)) {
        messages.forEach(msg => {
          console.log(`Message ${msg.id}: parentMessageId=${msg.parentMessageId}, content="${msg.content?.substring(0, 20) || ''}"`);
        });
      }

      // Build the parent-child structure with better null check and conversions
      if (Array.isArray(messages)) {
        messages.forEach(message => {
          // Ensure parentMessageId is a proper number
          const parentId = message.parentMessageId ? Number(message.parentMessageId) : undefined;

          // More thorough parentId check
          if (parentId !== undefined && parentId !== null && parentId > 0) {
            // This is a reply message
            replyMessageIds.add(message.id);

            // Add as child to parent
            if (!parentChildMap.has(parentId)) {
              parentChildMap.set(parentId, []);
            }

            parentChildMap.get(parentId)?.push(message.id);
            console.log(`✓ REPLY FOUND: Message ${message.id} is a reply to parent ${parentId}`);
          } else {
            console.log(`→ TOP-LEVEL: Message ${message.id} has no parent`);
          }
        });
      }

      // Find and sort top-level messages (not replies to anything)
      const topLevelMsgs = Array.isArray(messages) 
        ? messages
            .filter(msg => !replyMessageIds.has(msg.id))
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        : [];

      console.log("THREAD VIEW STRUCTURE:", {
        total: messages?.length || 0,
        topLevel: topLevelMsgs.length,
        topLevelIds: topLevelMsgs.map(m => m.id),
        replies: replyMessageIds.size,
        replyIds: Array.from(replyMessageIds),
        parentChildMap: Object.fromEntries(parentChildMap)
      });

      return { parentChildMap, topLevelMessages: topLevelMsgs, replyMessageIds };
    };

    const { parentChildMap, topLevelMessages, replyMessageIds } = getOrganizedThreadMessages();

    // Get thread info with type safety for consistent display
    const threadInfo: ThreadType = threadData || (thread as ThreadType) || defaultThread;

    // Recursive function to render a message and all its children
    const renderMessageTree = (message: MessageType, depth: number = 0) => {
      // Find direct child messages (replies to this message)
      const childIds = parentChildMap.get(message.id) || [];
      const childMessages = messages
        .filter(msg => childIds.includes(msg.id))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return (
        <div key={message.id} className="mb-2">
          {/* Current message */}
          <SimpleMessage 
            message={message} 
            isReply={replyMessageIds.has(message.id)}
            indent={depth}
            onReply={setReplyingTo}
            senderName={message.isOutbound ? "Creator" : (threadInfo.participantName || message.sender?.name || "User")}
            senderAvatar={message.isOutbound ? null : (threadInfo.participantAvatar || message.sender?.avatar)}
          />

          {/* Render all child messages recursively with increased depth */}
          {childMessages.length > 0 && (
            <div className="ml-4">
              {childMessages.map(childMsg => renderMessageTree(childMsg, depth + 1))}
            </div>
          )}
        </div>
      );
    };

    // Render all top-level messages with their replies
    return topLevelMessages.map(msg => renderMessageTree(msg));
  };

  // Reply input area
  const renderReplyForm = () => {
    const replyingToMessage = replyingTo !== null && Array.isArray(messages) 
      ? messages.find(m => m.id === replyingTo) 
      : null;

    return (
      <div className="border-t border-gray-200 p-4 bg-white shadow-sm">
        {replyingToMessage && (
          <div className="flex items-start mb-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex-1">
              <div className="flex items-center">
                <Reply className="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-blue-700">
                  Replying to {replyingToMessage.isOutbound ? "Creator" : replyingToMessage.sender?.name || "User"}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs ml-auto hover:bg-blue-100 hover:text-blue-800 transition-colors" 
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-slate-600 truncate mt-1 ml-6">{replyingToMessage.content}</p>
            </div>
          </div>
        )}

        <div className="flex items-end gap-3">
          <Textarea
            ref={messageInputRef}
            placeholder="Type your reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 min-h-[80px] resize-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 focus:outline-none transition-all duration-200 px-3 py-2.5"
          />
          <div className="flex flex-col gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleSendReply} 
              disabled={!replyText.trim() || isSendingReply}
              className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-md focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
            >
              {isSendingReply ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1.5" />
              )}
              Send
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGenerateReply}
              disabled={isGenerating || isGeneratingReply}
              className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
              title="Generate AI Reply"
            >
              {isGenerating || isGeneratingReply ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin text-blue-600" />
              ) : (
                <ThumbsUp className="h-4 w-4 mr-1.5 text-blue-600" />
              )}
              AI Reply
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Loading state with enhanced visual appearance
  if (isLoadingThread || isLoadingMessages) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
          <span className="text-slate-700 font-medium">Loading conversation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {renderThreadHeader()}

      <div className="flex-1 overflow-y-auto p-4">
        {renderMessages()}
        <div ref={messagesEndRef} />
      </div>

      {renderReplyForm()}
    </div>
  );
};

export default ConversationThread;