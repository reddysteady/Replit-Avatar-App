// See CHANGELOG.md for 2025-06-10 [Removed]
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Instagram, Youtube, Reply, CornerDownRight, MessageCircle } from 'lucide-react';
import { MessageType } from '@shared/schema';

interface SimpleMessageProps {
  message: MessageType;
  isReply?: boolean;
  onReply: (messageId: number) => void;
  senderName: string;
  senderAvatar?: string | null;
  indent?: number;
}

const SimpleMessage: React.FC<SimpleMessageProps> = ({
  message,
  isReply = false,
  onReply,
  senderName,
  senderAvatar,
  indent = 0
}) => {
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return '(unknown time)';
    }
  };

  // Calculate left padding based on threading level using rem units for consistency
  const indentSize = isReply ? `${Math.min(0.5 + indent * 0.75, 4)}rem` : '0';

  return (
    <div 
      className={`w-full p-3 ${isReply ? 'mb-1.5' : 'mb-3'}`}
      style={{ paddingLeft: indentSize }}
    >
      {/* Message container with subtle bg for grouping related messages */}
      <div className={`
        flex 
        ${message.isOutbound ? 'flex-row-reverse' : 'flex-row'}
        ${isReply ? 'bg-gray-50 rounded-md p-2' : ''}
        transition-all duration-200
      `}>
        {isReply && !message.isOutbound && (
          <div className="mr-1 flex items-start pt-2">
            <CornerDownRight className="h-3 w-3 text-slate-500" /> {/* Increased contrast */}
          </div>
        )}
        
        <div className={`${message.isOutbound ? 'ml-2' : 'mr-2'} flex-shrink-0`}>
          <Avatar className={`h-8 w-8 ${
            message.isHighIntent && !message.isOutbound 
              ? 'border-2 border-orange-500 ring-1 ring-orange-300' // Added ring for additional emphasis
              : 'border border-gray-300'
          }`}>
            {senderAvatar ? (
              <AvatarImage src={senderAvatar} />
            ) : (
              <AvatarFallback className="bg-white text-black">
                {message.source === 'instagram' ? <Instagram size={16} /> : <Youtube size={16} />}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        
        <div className={`flex-1 ${message.isOutbound ? 'items-end' : 'items-start'}`}>
          <div className="flex items-center mb-1.5">
            <span className="font-bold text-sm text-slate-900">{senderName}</span>
            <span className="text-slate-700 text-xs ml-2 font-medium"> {/* Darker gray for better contrast */}
              {formatTimestamp(message.timestamp)}
            </span>
            {message.isHighIntent && !message.isOutbound && (
              <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-800 border-orange-300 font-medium">
                High Intent
              </Badge>
            )}
            {isReply && (
              <div className="flex items-center ml-2 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full"> {/* Enhanced reply indicator */}
                <MessageCircle className="h-3 w-3 mr-1" />
                Reply
              </div>
            )}
          </div>
          
          <div className={`
            text-sm whitespace-pre-wrap break-words text-slate-800 font-medium
            ${message.isOutbound ? 'bg-blue-50 rounded-lg px-3 py-2' : 'bg-white border border-gray-100 shadow-sm rounded-lg px-3 py-2'}
          `}>
            {message.content || "(No message content)"}
          </div>
          
          {message.reply && message.reply.length > 0 && (
            <div className="mt-2 bg-white p-3 rounded-lg border border-gray-300 shadow-sm">
              <div className="flex items-center mb-1">
                <span className="font-semibold text-xs text-black">Creator</span>
                {message.isAiGenerated && (
                  <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-800 border-blue-300">AI Generated</Badge>
                )}
              </div>
              <div className="text-sm text-black font-medium">{message.reply}</div>
            </div>
          )}
          
          <div className="mt-2 flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs bg-gray-50 hover:bg-gray-100 hover:text-blue-600 transition-colors duration-200 focus:ring-2 focus:ring-blue-200 focus:outline-none" 
              onClick={() => onReply(message.id)}
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

export default SimpleMessage;