import { useEffect } from "react";
import MessageItem from "@/components/MessageItem";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageType } from "@shared/schema";

interface MessageQueueProps {
  messages: MessageType[];
  isLoading: boolean;
  source: 'instagram' | 'youtube';
}

const MessageSkeleton = () => (
  <div className="bg-white shadow-sm rounded-lg p-5 animate-pulse">
    <div className="flex items-start">
      <div className="h-10 w-10 rounded-full bg-neutral-200 mr-4"></div>
      <div className="flex-1">
        <div className="h-4 bg-neutral-200 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-neutral-200 rounded w-1/3 mb-3"></div>
        <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
      </div>
      <div className="h-6 w-16 bg-neutral-200 rounded-full"></div>
    </div>
    <div className="mt-4 flex items-center">
      <div className="h-10 bg-neutral-200 rounded flex-grow"></div>
      <div className="h-10 w-24 bg-neutral-200 rounded ml-2"></div>
    </div>
  </div>
);

const MessageQueue = ({ messages, isLoading, source }: MessageQueueProps) => {
  // Scroll to bottom of messages when new ones arrive
  useEffect(() => {
    const scrollContainer = document.getElementById('message-queue-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <MessageSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-8 text-center">
        <p className="text-neutral-500">No messages available</p>
      </div>
    );
  }

  return (
    <div id="message-queue-container" className="space-y-4 mb-6 custom-scrollbar max-h-[calc(100vh-12rem)] overflow-y-auto pb-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
};

export default MessageQueue;
