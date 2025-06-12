// See CHANGELOG.md for 2025-06-12 [Changed]
import React, { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Menu, FileQuestion, RefreshCw, Link2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
// Using simple image tag to ensure SSR markup includes the URL

type ChatHeaderProps = {
  name?: string;
  avatarUrl?: string;
  platform?: string;
  onBack?: () => void;
  onDeleteThread?: () => void;
};

const ChatHeader = ({
  name = "",
  avatarUrl = "",
  platform = "",
  onBack,
  onDeleteThread,
}: ChatHeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: threads = [] } = useQuery({ queryKey: ["/api/threads"] });
  const [customThreadId, setCustomThreadId] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const handleGenerateBatch = () => {
    fetch("/api/test/generate-batch", { method: "POST" })
      .then(res => {
        if (!res.ok) {
          return res.text().then(t => {
            throw new Error(`Server error: ${t}`);
          });
        }
        return res.json();
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/instagram/messages"] });
        queryClient.invalidateQueries({ queryKey: ["/api/youtube/messages"] });
        toast({ title: "Batch generated", description: "10 messages created" });
      })
      .catch(err => {
        console.error("Batch error:", err);
        toast({ title: "Error", description: String(err), variant: "destructive" });
      });
  };

  const handleSendCustom = () => {
    if (!customThreadId) return;
    fetch(`/api/test/generate-for-user/${customThreadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: customMessage }),
    })
      .then(res => {
        if (!res.ok) {
          return res.text().then(t => {
            throw new Error(`Server error: ${t}`);
          });
        }
        return res.json();
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
        toast({
          title: "Message generated",
          description: `Message added to thread ${customThreadId}`,
        });
        setCustomMessage("");
      })
      .catch(err => {
        console.error("Generate error:", err);
        toast({ title: "Error", description: String(err), variant: "destructive" });
      });
  };

  const handleReloadDatabase = () => {
    toast({
      title: "Database Refresh",
      description: "Refreshing messages from database...",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/instagram/messages"] });
    queryClient.invalidateQueries({ queryKey: ["/api/youtube/messages"] });
  };

  const handleReloadCache = () => {
    toast({
      title: "Cache Refresh",
      description: "Clearing frontend cache and refreshing data...",
    });
    queryClient.invalidateQueries();
  };

  const handleSetupWebhook = async () => {
    try {
      const res = await fetch("/api/instagram/setup-webhook", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Webhook Setup", description: "Instagram webhook successfully configured" });
      } else {
        toast({ title: "Webhook Setup Failed", description: data.message || "Failed to set up Instagram webhook", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Webhook Setup Error", description: "An error occurred during webhook setup", variant: "destructive" });
    }
  };

  return (
    <div className="relative md:hidden">
      <header className="flex items-center justify-between p-3 bg-[#111B21] text-white w-full">
        <div className="flex items-center">
          {onBack && (
            <button
              aria-label="Back"
              className="mr-3 flex items-center justify-center text-white"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          {avatarUrl && (
            <img src={avatarUrl} alt={name} className="h-8 w-8 rounded-full mr-3" />
          )}
          {name && (
            <span className="font-medium text-sm flex items-center">
              {name}
              {platform && (
                <span className="ml-2 bg-neutral-700 text-xs px-1.5 py-0.5 rounded capitalize">
                  {platform}
                </span>
              )}
            </span>
          )}
        </div>
        <button
          aria-label="Menu"
          className="p-2 text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-2/5 max-w-sm bg-white text-black shadow-md rounded-md p-4 space-y-2 z-20">
          {onDeleteThread && (
            <>
              <div className="font-medium text-sm">Thread Actions</div>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onDeleteThread();
                  setMenuOpen(false);
                }}
              >
                Delete Thread
              </Button>
              <hr className="border-t border-gray-200 my-2" />
            </>
          )}
          <div className="font-medium text-sm">Tools</div>
          <Button className="w-full mb-2" onClick={handleGenerateBatch}>
            <FileQuestion className="h-4 w-4 mr-2" /> Generate Batch Messages
          </Button>
          <Select onValueChange={id => setCustomThreadId(id)} value={customThreadId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Generate For Thread" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {Array.isArray(threads) &&
                (threads as any[]).map((thread: any) => (
                  <SelectItem key={thread.id} value={String(thread.id)}>
                    {thread.participantName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <input
            className="mt-2 w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="Custom message"
            value={customMessage}
            onChange={e => setCustomMessage(e.target.value)}
          />
          <Button className="w-full mt-2" onClick={handleSendCustom}>
            Send Custom Message
          </Button>
          <Button className="w-full mt-2" variant="outline" onClick={handleReloadDatabase}>
            <RefreshCw className="h-4 w-4 mr-2" /> Reload - database
          </Button>
          <Button className="w-full mt-2" variant="outline" onClick={handleReloadCache}>
            <RefreshCw className="h-4 w-4 mr-2" /> Reload - frontend cache
          </Button>
          <Button className="w-full mt-2" variant="outline" onClick={handleSetupWebhook}>
            <Link2 className="h-4 w-4 mr-2" /> Setup Webhook
          </Button>
          <hr className="border-t border-gray-200 my-2" />
          <Link href="/instagram" className="block px-4 py-2 text-sm hover:bg-gray-100 rounded">
            Instagram DMs
          </Link>
          <Link href="/youtube" className="block px-4 py-2 text-sm hover:bg-gray-100 rounded">
            YouTube Comments
          </Link>
          <Link href="/settings" className="block px-4 py-2 text-sm hover:bg-gray-100 rounded">
            Settings
          </Link>
          <Link href="/analytics" className="block px-4 py-2 text-sm hover:bg-gray-100 rounded">
            Analytics
          </Link>
          <Link href="/automation" className="block px-4 py-2 text-sm hover:bg-gray-100 rounded">
            Automation Rules
          </Link>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
