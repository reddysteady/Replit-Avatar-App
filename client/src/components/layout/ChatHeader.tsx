// See CHANGELOG.md for 2025-06-14 [Changed - removed tools menu on mobile]
// See CHANGELOG.md for 2025-06-14 [Added - generate custom message action]
// See CHANGELOG.md for 2025-06-14 [Added - custom message textbox]
import React from "react";
import { ArrowLeft } from "lucide-react";
// Using simple image tag to ensure SSR markup includes the URL

type ChatHeaderProps = {
  name?: string;
  avatarUrl?: string;
  platform?: string;
  onBack?: () => void;
  onDeleteThread?: () => void;
  onGenerateCustomMessage?: (msg: string) => void;
};

const ChatHeader = ({
  name = "",
  avatarUrl = "",
  platform = "",
  onBack,
  onDeleteThread,
  onGenerateCustomMessage,
}: ChatHeaderProps) => {

  if (typeof window !== "undefined" && (window as any).DEBUG_AI) {
    console.debug("[DEBUG-AI] ChatHeader render", {
      hasDelete: !!onDeleteThread,
    });
  }

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
      </header>
    </div>
  );
};

export default ChatHeader;
