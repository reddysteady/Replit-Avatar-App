import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ThreadedMessage {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  parentMessageId?: string;
  depth: number;
  replies: ThreadedMessage[];
}

interface ThreadedMessageDisplayProps {
  conversationId: string;
}

// Recursive component to render a message and its replies
const MessageItem: React.FC<{ message: ThreadedMessage; depth: number }> = ({ message, depth }) => {
  const paddingLeft = depth * 20;
  
  return (
    <div className="mb-4">
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative"
        style={{ marginLeft: `${paddingLeft}px` }}
      >
        {/* Threading line for replies */}
        {depth > 0 && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300"
            style={{ left: `-${paddingLeft / 2}px` }}
          />
        )}
        
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {message.senderId.substring(0, 1).toUpperCase()}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Sender info */}
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-900">
                User {message.senderId}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(message.timestamp).toLocaleString()}
              </span>
            </div>
            
            {/* Message content */}
            <div className="text-sm text-gray-800 whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recursively render replies */}
      {message.replies.length > 0 && (
        <div className="mt-2">
          {message.replies.map((reply) => (
            <MessageItem 
              key={reply.id} 
              message={reply} 
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ThreadedMessageDisplay: React.FC<ThreadedMessageDisplayProps> = ({ conversationId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch threaded messages using the new API endpoint
  const { data: messages, isLoading, error, refetch } = useQuery({
    queryKey: ['threaded-messages', conversationId],
    queryFn: async () => {
      const response = await fetch(`/api/messages/threaded?conversationId=${conversationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch threaded messages');
      }
      return response.json() as Promise<ThreadedMessage[]>;
    },
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading conversation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium mb-2">Error loading conversation</h3>
        <p className="text-red-700 text-sm">
          Failed to load threaded messages. Please try refreshing.
        </p>
        <button 
          onClick={() => refetch()}
          className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No messages in this conversation yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <MessageItem 
            key={message.id} 
            message={message} 
            depth={0} 
          />
        ))}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ThreadedMessageDisplay;