// See CHANGELOG.md for 2025-06-09 [Added]
// See CHANGELOG.md for 2025-06-10 [Added]
// See CHANGELOG.md for 2025-06-16 [Fixed]
// See CHANGELOG.md for 2025-06-09 [Changed]
// See CHANGELOG.md for 2025-06-09 [Changed - thread dropdown]
// See CHANGELOG.md for 2025-06-10 [Fixed - batch invalidation keys]
// See CHANGELOG.md for 2025-06-10 [Added]
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import MessageItem from "@/components/MessageItem";
import FilterButtons from "@/components/FilterButtons";
import StatusInfo from "@/components/StatusInfo";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, MessageThread } from "@shared/schema";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, RefreshCw, Link2, MessageSquare, FileQuestion, Search } from "lucide-react";
import AutoRepliesToggle from "../../components/AutoRepliesToggle";
import { useToast } from "@/hooks/use-toast";
import { MessageType } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface CustomMsgPayload {
  threadId: number;
  content: string;
  thread: MessageThread;
}


const Messages = () => {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [customThreadId, setCustomThreadId] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // Query messages data
  const { data: instagramMessages = [], isLoading: loadingInstagram } = useQuery<MessageType[]>({
    queryKey: ['/api/messages/instagram'],
    refetchInterval: 10000, // Refetch more frequently (every 10 seconds)
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: youtubeMessages = [], isLoading: loadingYoutube } = useQuery<MessageType[]>({
    queryKey: ['/api/messages/youtube'],
    refetchInterval: 10000, // Refetch more frequently (every 10 seconds)
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: threads = [] } = useQuery({
    queryKey: ['/api/threads'],
    staleTime: 10000,
  });

  // Query settings to check connection status
  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });

  const canSend = !!settings;

  const sendCustom = useMutation({
    mutationFn: (payload: CustomMsgPayload) =>
      apiRequest('POST', `/api/test/generate-for-user/${payload.threadId}`, {
        content: payload.content,
      }).then(res => res.json()),
    onSuccess: async (newMsg: MessageType, variables: CustomMsgPayload) => {
      const { thread } = variables;
      await queryClient.invalidateQueries({ queryKey: ['/api/threads', thread.id] });

      const ai = settings?.aiSettings;
      const channelOK =
        thread.source === 'instagram'
          ? ai?.autoReplyInstagram
          : thread.source === 'youtube'
            ? ai?.autoReplyYoutube
            : false;

      if (process.env.NODE_ENV === 'development' && (window as any).DEBUG_AUTO_REPLY) {
        console.trace('[AUTO]', { threadId: thread.id, auto: thread.autoReply, channelOK });
      }

      if (thread.autoReply && channelOK) {
        await apiRequest('POST', `/api/${thread.source}/ai-reply`, {
          threadId: thread.id,
          triggerMsgId: newMsg.id,
        });
      }
    },
  });
  
  // Check if Instagram is connected
  const isInstagramConnected = settings && settings.instagramToken ? true : false;

  // Combined messages from both platforms
  const allMessages = [
    ...instagramMessages,
    ...youtubeMessages
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter messages based on active filter and search query
  const getFilteredMessages = () => {
    let filtered = [];
    
    // First filter by platform/status
    switch (activeFilter) {
      case "instagram":
        filtered = instagramMessages || [];
        break;
      case "youtube":
        filtered = youtubeMessages || [];
        break;
      case "new":
        filtered = allMessages.filter(msg => msg.status === "new");
        break;
      case "high-intent":
        filtered = allMessages.filter(msg => msg.isHighIntent);
        break;
      case "replied":
        filtered = allMessages.filter(msg => msg.status === "replied" || msg.status === "auto-replied");
        break;
      default:
        filtered = allMessages;
    }
    
    // Then filter by search query if present
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.content.toLowerCase().includes(query) || 
        msg.sender.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  // Force refresh messages
  const handleRefreshMessages = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/messages/instagram'] });
    queryClient.invalidateQueries({ queryKey: ['/api/messages/youtube'] });
    toast({
      title: "Refreshing messages",
      description: "Fetching the latest messages...",
    });
  };

  const filteredMessages = getFilteredMessages();

  return (
    <div className="flex flex-col h-full">
      {/* Header and controls */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold flex items-center text-black">
            <MessageSquare className="mr-2 h-6 w-6" />
            Messages
          </h1>
          <div className="flex items-center space-x-2">
            {/* Test Tools Accordion */}
            <div className="relative">
              <Accordion type="single" collapsible>
                <AccordionItem value="tools">
                  <AccordionTrigger className="bg-gray-900 text-white px-4 py-2 rounded flex items-center h-9 border-gray-900 hover:bg-gray-800">
                    <FileQuestion className="h-4 w-4 mr-2" />
                    Tools
                  </AccordionTrigger>
                  <AccordionContent className="absolute right-0 z-10 mt-1 bg-white border border-gray-200 shadow-lg rounded w-64">
                    <div className="px-4 py-3">
                      <Button
                        className="w-full mb-2 bg-gray-900 text-white hover:bg-gray-800 border-gray-900"
                        onClick={() => {
                          fetch('/api/test/generate-batch', { method: 'POST' })
                            .then(res => {
                              if (!res.ok) {
                                return res.text().then(t => { throw new Error(`Server error: ${t}`); });
                              }
                              return res.json();
                            })
                            .then(() => {
                              queryClient.invalidateQueries({ queryKey: ['/api/instagram/messages'] });
                              queryClient.invalidateQueries({ queryKey: ['/api/youtube/messages'] });
                              toast({ title: 'Batch generated', description: '10 messages created' });
                            })
                            .catch(err => {
                              console.error('Batch error:', err);
                              toast({ title: 'Error', description: String(err), variant: 'destructive' });
                            });
                        }}
                      >
                        Generate Batch Messages
                      </Button>
                      <Select
                        onValueChange={(id) => setCustomThreadId(id)}
                        value={customThreadId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Generate For Thread" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {Array.isArray(threads) &&
                            threads.map((thread: any) => (
                              <SelectItem key={thread.id} value={String(thread.id)}>
                                {thread.participantName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Input
                        className="mt-2"
                        placeholder="Custom message"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                      />
                      <Button
                        className="w-full mt-2"
                        disabled={!canSend}
                        onClick={() => {
                          if (!customThreadId) return;
                          const thread = Array.isArray(threads)
                            ? (threads as MessageThread[]).find((t) => t.id === Number(customThreadId))
                            : undefined;
                          if (!thread) return;

                          sendCustom.mutate({
                            threadId: Number(customThreadId),
                            content: customMessage,
                            thread,
                          }, {
                            onSuccess: () => {
                              toast({
                                title: 'Message generated',
                                description: `Message added to thread ${customThreadId}`,
                              });
                              setCustomMessage('');
                            },
                            onError: (err) => {
                              toast({
                                title: 'Error',
                                description: err instanceof Error ? err.message : String(err),
                                variant: 'destructive',
                              });
                            },
                          });
                        }}
                      >
                        Send Custom Message
                      </Button>
                      {/* Database refresh replicates Testing Tools page */}
                      <Button
                        className="w-full mt-2"
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: 'Database Refresh',
                            description: 'Refreshing messages from database...'
                          });
                          // Refetch messages directly from storage
                          queryClient.invalidateQueries({ queryKey: ['/api/instagram/messages'] });
                          queryClient.invalidateQueries({ queryKey: ['/api/youtube/messages'] });
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reload - database
                      </Button>
                      {/* Clear frontend cache for fresh data */}
                      <Button
                        className="w-full mt-2"
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: 'Cache Refresh',
                            description: 'Clearing frontend cache and refreshing data...'
                          });
                          // Invalidate all cached queries
                          queryClient.invalidateQueries();
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reload - frontend cache
                      </Button>
                      {/* Setup Instagram webhook for real-time updates */}
                      <Button
                        className="w-full mt-2"
                        variant="outline"
                        onClick={() => {
                          const setupWebhook = async () => {
                            try {
                              const response = await fetch('/api/instagram/setup-webhook', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' }
                              });
                              const data = await response.json();

                              if (response.ok) {
                                toast({
                                  title: 'Webhook Setup',
                                  description: 'Instagram webhook successfully configured'
                                });
                              } else {
                                toast({
                                  title: 'Webhook Setup Failed',
                                  description: data.message || 'Failed to set up Instagram webhook',
                                  variant: 'destructive'
                                });
                              }
                            } catch (error) {
                              toast({
                                title: 'Webhook Setup Error',
                                description: 'An error occurred during webhook setup',
                                variant: 'destructive'
                              });
                            }
                          };
                          setupWebhook();
                        }}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        Setup Webhook
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-gray-50 px-3 py-1 rounded-md border border-gray-300">
                <AutoRepliesToggle source="instagram" />
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshMessages}
                className="flex items-center bg-gray-50 hover:bg-gray-100 text-black border border-gray-300"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reload messages
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search messages..."
              className="pl-9 bg-gray-50 text-black placeholder:text-gray-700 border-gray-300 focus-visible:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Filters */}
        <FilterButtons 
          active={activeFilter} 
          onFilterChange={setActiveFilter} 
          filters={[
            { id: "all", label: "All", count: allMessages.length },
            { id: "instagram", label: "Instagram", count: instagramMessages?.length || 0 },
            { id: "youtube", label: "YouTube", count: youtubeMessages?.length || 0 },
            { id: "new", label: "New", count: allMessages.filter(msg => msg.status === "new").length },
            { id: "high-intent", label: "High Intent", count: allMessages.filter(msg => msg.isHighIntent).length },
            { id: "replied", label: "Replied", count: allMessages.filter(msg => msg.status === "replied" || msg.status === "auto-replied").length }
          ]}
        />

        {/* Settings panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-md font-medium mb-2">Instagram</h3>
                {isInstagramConnected ? (
                  <div className="flex flex-col space-y-2">
                    <StatusInfo status="connected" message="Instagram Account Connected" />
                    <AutoRepliesToggle source="instagram" />
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <StatusInfo status="disconnected" message="Instagram Account Not Connected" />
                    <Link href="/connect/instagram">
                      <Button size="sm" variant="outline">
                        Connect Instagram
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">YouTube</h3>
                <div className="flex flex-col space-y-2">
                  <StatusInfo status="connected" message="YouTube Account Connected" />
                  <AutoRepliesToggle source="youtube" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {(loadingInstagram || loadingYoutube) && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!loadingInstagram && !loadingYoutube && filteredMessages.length === 0 && (
          <div className="text-center my-12 text-gray-500">
            <MessageSquare className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No messages found</p>
            <p className="mt-1">
              {activeFilter !== "all" 
                ? `No messages match the "${activeFilter}" filter.` 
                : "Check back later or connect your accounts to receive messages."}
            </p>
          </div>
        )}

        {filteredMessages.map((message) => (
          <div key={message.id} className="mb-3">
            <MessageItem message={message} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Messages;