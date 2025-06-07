import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/hooks/useMessages";
import FilterButtons from "@/components/FilterButtons";
import MessageQueue from "@/components/MessageQueue";
import { InstagramAuth } from "@/components/InstagramAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Settings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp, RefreshCw, Link2, Wrench } from "lucide-react";

const Instagram = () => {
  const [aiAutoReplies, setAiAutoReplies] = useState(false);
  const [bannerExpanded, setBannerExpanded] = useState(false); // Controls if the testing banner is expanded
  const { toast } = useToast();
  
  const {
    messages,
    allMessages,
    isLoading,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    lastUpdated,
    isRefreshing,
    refetch,
    handleRefresh
  } = useMessages('instagram');

  // Fetch settings to check if Instagram is connected and get current toggle state
  // Initialize toggle state from server settings
  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });
  
  // Update local state whenever settings change
  useEffect(() => {
    if (settings) {
      setAiAutoReplies(Boolean(settings.aiAutoRepliesInstagram));
    }
  }, [settings]);
  
  const isConnected = settings?.apiKeys?.instagram && 
                     settings?.apiKeys?.instagramUserId;

  const toggleAiAutoRepliesMutation = useMutation({
    mutationFn: (enabled: boolean) => {
      return apiRequest("POST", "/api/settings/ai-auto-replies", {
        enabled,
        source: "instagram",
      });
    },
    onSuccess: (_, variables) => {
      // Use the variables that were sent in the mutation
      const newState = variables;
      
      // Refresh settings from server
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      
      toast({
        title: `AI auto-replies ${newState ? "enabled" : "disabled"}`,
        description: `AI will ${newState ? "now" : "no longer"} automatically reply to new Instagram DMs.`,
      });
    },
    onError: (error) => {
      // Revert switch state on error
      setAiAutoReplies(!aiAutoReplies);
      toast({
        title: "Failed to update setting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleAiAutoReplies = () => {
    // Only toggle if Instagram is connected
    if (isConnected) {
      const newValue = !aiAutoReplies;
      // First update UI for immediate feedback
      setAiAutoReplies(newValue);
      // Then send to server
      toggleAiAutoRepliesMutation.mutate(newValue);
    } else {
      toast({
        title: "Instagram not connected",
        description: "Please connect your Instagram account first.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none md:pt-0 pt-16">
      {/* Testing Banner - Accordion style toggle */}
      <div className="sticky top-0 z-10">
        {/* Collapsed state - just show the tab in filing cabinet style */}
        {!bannerExpanded && (
          <div 
            className="inline-flex items-center bg-[#0D1117] text-white py-1 px-4 border border-[#30363D] border-b-0 rounded-t-md ml-4 cursor-pointer shadow-md relative"
            onClick={() => setBannerExpanded(true)}
            style={{ 
              marginBottom: "-1px", 
              zIndex: 20,
              borderTopLeftRadius: "8px",
              borderTopRightRadius: "8px"
            }}
          >
            <Wrench className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Test Tools</span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </div>
        )}
        
        {/* Expanded state - show the full banner with tools */}
        {bannerExpanded && (
          <div className="bg-[#0D1117] text-white border border-[#30363D] shadow-md">
            <div 
              className="py-1 px-4 flex items-center justify-between cursor-pointer border-b border-[#30363D]"
              onClick={() => setBannerExpanded(false)}
              style={{ backgroundColor: "#0D1117" }}
            >
              <div className="flex items-center">
                <Wrench className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Test Tools</span>
              </div>
              <ChevronUp className="h-4 w-4" />
            </div>
            
            <div className="flex items-center space-x-3 p-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Database Refresh",
                    description: "Refreshing messages from database..."
                  });
                  
                  // Refetch Instagram messages directly from DB without API call
                  refetch();
                }}
                className="bg-transparent hover:bg-gray-700 text-white border-gray-600 hover:border-gray-500"
                disabled={!isConnected}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload - database
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Cache Refresh",
                    description: "Clearing frontend cache and refreshing data..."
                  });
                  
                  // Invalidate and refetch all queries
                  queryClient.invalidateQueries();
                }}
                className="bg-transparent hover:bg-gray-700 text-white border-gray-600 hover:border-gray-500"
                disabled={!isConnected}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload - frontend cache
              </Button>

              <Button 
                variant="outline"
                size="sm"
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
                          title: "Webhook Setup",
                          description: "Instagram webhook successfully configured",
                        });
                      } else {
                        toast({
                          title: "Webhook Setup Failed",
                          description: data.message || "Failed to set up Instagram webhook",
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Webhook Setup Error",
                        description: "An error occurred during webhook setup",
                        variant: "destructive",
                      });
                    }
                  };
                  
                  setupWebhook();
                }}
                className="bg-transparent hover:bg-gray-700 text-white border-gray-600 hover:border-gray-500"
                disabled={!isConnected}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Setup Webhook
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
                Messages
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-4">
              <div className="flex items-center bg-gray-100 px-3 py-1 rounded">
                <span className="mr-3 text-sm font-medium text-gray-800">AI Auto-replies</span>
                <Switch 
                  checked={aiAutoReplies} 
                  onCheckedChange={handleToggleAiAutoReplies}
                  disabled={!isConnected}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
                />
              </div>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  const manualPoll = async () => {
                    try {
                      const response = await fetch('/api/instagram/poll', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                      });
                      const data = await response.json();
                      
                      refetch(); // Refresh messages after polling
                      
                      toast({
                        title: "Messages Refreshed",
                        description: "Checked for new Instagram messages",
                      });
                    } catch (error) {
                      toast({
                        title: "Refresh Failed",
                        description: "Failed to check for new messages",
                        variant: "destructive",
                      });
                    }
                  };
                  
                  manualPoll();
                }}
                className="flex items-center"
                disabled={!isConnected}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload messages
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <Tabs defaultValue={isConnected ? "messages" : "connect"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="connect">Connect Instagram</TabsTrigger>
              <TabsTrigger value="messages" disabled={!isConnected}>Messages</TabsTrigger>
            </TabsList>
            
            <TabsContent value="connect" className="mt-6">
              <InstagramAuth />
            </TabsContent>
            
            <TabsContent value="messages" className="mt-6">
              {isConnected ? (
                <>
                  <FilterButtons
                    active={activeFilter}
                    onFilterChange={(f) => setActiveFilter(f as any)}
                    filters={[]}
                  />
                  
                  <MessageQueue
                    messages={messages}
                    isLoading={isLoading}
                    source="instagram"
                  />
                  

                  
                  {/* Message status display placeholder */}
                  <div className="text-sm text-gray-500 mt-2">
                    Showing {messages.length} of {allMessages.length} messages
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-neutral-600">
                    Please connect your Instagram account to view messages.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
};

export default Instagram;
