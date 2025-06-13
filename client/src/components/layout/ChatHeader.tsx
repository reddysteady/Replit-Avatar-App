// See CHANGELOG.md for 2025-06-14 [Changed - removed tools menu on mobile]
// See CHANGELOG.md for 2025-06-14 [Added - generate custom message action]
import React, { useState } from "react";
import { ArrowLeft, Menu, Trash2, MessageSquarePlus } from "lucide-react";
// Using simple image tag to ensure SSR markup includes the URL

type ChatHeaderProps = {
  name?: string;
  avatarUrl?: string;
  platform?: string;
  onBack?: () => void;
  onDeleteThread?: () => void;
  onGenerateCustomMessage?: () => void;
};

const ChatHeader = ({
  name = "",
  avatarUrl = "",
  platform = "",
  onBack,
  onDeleteThread,
  onGenerateCustomMessage,
}: ChatHeaderProps) => {
  const handleDeleteThread = onDeleteThread ?? (() => {});
  const handleGenerateCustomMessage = onGenerateCustomMessage ?? (() => {});

  if (typeof window !== "undefined" && (window as any).DEBUG_AI) {
    console.debug("[DEBUG-AI] ChatHeader render", {
      hasDelete: !!onDeleteThread,
    });
  }

  const [menuOpen, setMenuOpen] = useState(false);
  // Mobile header no longer exposes tools actions

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
            <img
              src={avatarUrl}
              alt={name}
              className="h-8 w-8 rounded-full mr-3"
            />
          )}
          {name && (
            <span className="font-medium text-sm flex items-center">
              {name}
              {platform && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700 capitalize">
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
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 z-50 w-2/5 max-w-sm min-w-[240px] h-full bg-white shadow-2xl rounded-l-lg py-4 px-4 flex flex-col space-y-2">
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase mb-1 mt-2 px-1">
                Thread Actions
              </div>
              <button
                className="flex items-center space-x-2 w-full text-left py-2 my-1 font-medium text-gray-900 rounded-md hover:bg-gray-100 focus:outline-none focus:bg-gray-200 min-h-[44px] px-1"
                onClick={() => {
                  handleDeleteThread();
                  setMenuOpen(false);
                }}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Delete Thread</span>
              </button>
              <button
                className="flex items-center space-x-2 w-full text-left py-2 my-1 font-medium text-gray-900 rounded-md hover:bg-gray-100 focus:outline-none focus:bg-gray-200 min-h-[44px] px-1"
                onClick={() => {
                  handleGenerateCustomMessage();
                  setMenuOpen(false);
                }}
              >
                <MessageSquarePlus className="w-4 h-4 text-blue-500" />
                <span>Generate Custom Message</span>
              </button>
            </div>
            <div className="border-t border-gray-200 my-2" />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatHeader;
