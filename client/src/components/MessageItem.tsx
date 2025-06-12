// See CHANGELOG.md for 2025-06-08 [Changed]
// See CHANGELOG.md for 2025-06-10 [Removed]
// See CHANGELOG.md for 2025-06-12 [Fixed - detailed AI error messages]
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ReplyIcon, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Bot,
  Instagram,
  Youtube
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { MessageType } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface MessageItemProps {
  message: MessageType;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: sendReply, isPending: isSending } = useMutation({
    mutationFn: (data: { messageId: number; reply: string }) =>
      apiRequest("POST", `/api/${message.source}/reply`, data),
    onSuccess: () => {
      setIsReplying(false);
      setReplyText("");
      // Invalidate queries to refresh message list
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${message.source}`] });
      toast({
        title: "Reply sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error sending reply",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  });

  const { mutate: generateReply, isPending: isGenerateLoading } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/messages/${message.id}/generate-reply`);
      // Parse the response properly
      const jsonData = await response.json();
      return jsonData;
    },
    onSuccess: (data) => {
      // Access the data returned from the API
      if (data && typeof data === 'object' && 'generatedReply' in data) {
        setReplyText(data.generatedReply as string);
        setIsGenerating(false);
        setIsReplying(true);
        toast({
          title: "Reply generated",
          description: "AI has generated a reply. You can edit it before sending.",
        });
      } else {
        setIsGenerating(false);
        toast({
          title: "Error generating reply",
          description: "Unexpected response format from the server.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({
        title: "Error generating reply",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  });

  const handleReply = () => {
    setIsReplying(true);
  };

  const handleCancelReply = () => {
    setIsReplying(false);
    setReplyText("");
  };

  const handleSendReply = () => {
    if (replyText.trim() === "") {
      toast({
        title: "Empty reply",
        description: "Please enter a message before sending.",
        variant: "destructive",
      });
      return;
    }
    sendReply({ messageId: message.id, reply: replyText });
  };

  const handleGenerateReply = () => {
    setIsGenerating(true);
    generateReply();
  };

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

  const getStatusBadge = () => {
    switch (message.status) {
      case 'new':
        return (
          <Badge variant="default" className="bg-blue-600 text-white font-medium">New</Badge>
        );
      case 'replied':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-900 border-green-300 font-medium">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Replied
          </Badge>
        );
      case 'auto-replied':
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-900 border-purple-300 font-medium">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Auto-Replied
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderTimestamp = () => {
    try {
      return formatDistanceToNow(new Date(message.timestamp), { addSuffix: true });
    } catch (error) {
      return "Unknown time";
    }
  };

  return (
    <div className={`w-full border-b border-gray-200 p-4 ${message.isHighIntent ? "border-l-4 border-l-amber-500" : ""}`}>
      <div className="flex items-start">
        <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
          <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
          <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium">{message.sender.name}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <span className="flex items-center mr-2">
                  {getSourceIcon(message.source)}
                  {message.source.charAt(0).toUpperCase() + message.source.slice(1)}
                </span>
                <span>•</span>
                <span className="ml-2">{renderTimestamp()}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              {message.isHighIntent && (
                <Badge variant="outline" className="mr-2 bg-amber-100 text-amber-900 border-amber-300 font-medium">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  High Intent
                </Badge>
              )}
              {getStatusBadge()}
            </div>
          </div>
          
          <p className="text-sm text-gray-800 mt-2">{message.content}</p>
          
          {/* Show reply if message has been replied to */}
          {(message.status === 'replied' || message.status === 'auto-replied') && message.reply && (
            <div className="mt-3 pl-3 p-2">
              <p className="text-sm text-gray-500 mb-1">
                {message.isAiGenerated 
                  ? <Badge variant="outline" className="text-xs bg-blue-100 text-blue-900 border-blue-200 font-medium">AI Generated</Badge>
                  : "Your reply:"}
              </p>
              <p className="text-sm text-gray-700">{message.reply}</p>
            </div>
          )}

          {/* Reply form */}
          {isReplying && (
            <div className="mt-3">
              <Textarea 
                placeholder="Type your reply here..." 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end mt-2 space-x-2">
                <Button variant="outline" size="sm" onClick={handleCancelReply} disabled={isSending}>
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSendReply} 
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <ReplyIcon className="mr-2 h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="mt-3 flex justify-end space-x-2">
            {!isReplying && message.status === 'new' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleGenerateReply}
                  disabled={isGenerating || isReplying}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Bot className="mr-2 h-4 w-4 text-white" />
                      Generate AI Reply
                    </>
                  )}
                </Button>
                <Button 
                  size="sm"
                  onClick={handleReply}
                  disabled={isGenerating}
                  className="bg-gray-900 text-white hover:bg-gray-800 border-gray-900"
                >
                  <ReplyIcon className="mr-2 h-4 w-4" />
                  Reply
                </Button>
              </>
            )}
            
            {!isReplying && (message.status === 'replied' || message.status === 'auto-replied') && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleReply}
                className="bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-300"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Send New Reply
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;