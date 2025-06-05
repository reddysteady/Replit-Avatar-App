import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useMessages } from "@/hooks/useMessages";
import FilterButtons from "@/components/FilterButtons";
import MessageQueue from "@/components/MessageQueue";
import StatusInfo from "@/components/StatusInfo";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const YouTube = () => {
  const [aiAutoReplies, setAiAutoReplies] = useState(false);
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
  } = useMessages('youtube');

  const toggleAiAutoRepliesMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest("POST", "/api/settings/ai-auto-replies", {
        enabled,
        source: "youtube",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: `AI auto-replies ${aiAutoReplies ? "disabled" : "enabled"}`,
        description: `AI will ${aiAutoReplies ? "no longer" : "now"} automatically reply to new YouTube comments.`,
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
    const newValue = !aiAutoReplies;
    setAiAutoReplies(newValue);
    toggleAiAutoRepliesMutation.mutate(newValue);
  };

  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none md:pt-0 pt-16">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
                YouTube Comments
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <div className="flex items-center">
                <span className="mr-3 text-sm font-medium text-neutral-700">AI Auto-replies</span>
                <Switch 
                  checked={aiAutoReplies} 
                  onCheckedChange={handleToggleAiAutoReplies}
                  disabled={toggleAiAutoRepliesMutation.isPending}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <FilterButtons
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          
          <MessageQueue
            messages={messages}
            isLoading={isLoading}
            source="youtube"
          />
          
          <StatusInfo
            count={messages.length}
            total={allMessages.length}
            lastUpdated={lastUpdated}
            isRefreshing={isRefreshing}
          />
        </div>
      </div>
    </main>
  );
};

export default YouTube;
