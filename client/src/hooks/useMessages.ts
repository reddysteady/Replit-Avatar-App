import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageType } from "@shared/schema";

type FilterOption = "all" | "unread" | "replied" | "auto-replied";

export function useMessages(source: 'instagram' | 'youtube') {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useQuery<MessageType[]>({
    queryKey: [`/api/${source}/messages`],
    refetchInterval: 60000, // Refetch every minute
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setLastUpdated(new Date());
    setIsRefreshing(false);
  }, [refetch]);

  useEffect(() => {
    // Initial fetch
    handleRefresh();

    // Set up interval for periodic refreshes
    const intervalId = setInterval(() => {
      handleRefresh();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [handleRefresh]);

  const filteredMessages = messages.filter((message) => {
    // Apply status filter
    if (activeFilter === "unread" && message.status !== "new") return false;
    if (activeFilter === "replied" && message.status !== "replied") return false;
    if (activeFilter === "auto-replied" && message.status !== "auto-replied") return false;

    // Apply search filter (case insensitive)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        message.content.toLowerCase().includes(query) ||
        message.sender.name.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return {
    messages: filteredMessages,
    allMessages: messages,
    isLoading,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    lastUpdated,
    isRefreshing,
    handleRefresh,
    refetch, // Expose refetch for manual polling
  };
}
