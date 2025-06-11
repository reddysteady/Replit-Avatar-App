// See CHANGELOG.md for 2025-06-10 [Added]
import React from "react";
import { ArrowLeft } from "lucide-react";
// Using simple image tag to ensure SSR markup includes the URL

type ChatHeaderProps = {
  name: string;
  avatarUrl: string;
};

const ChatHeader = ({ name, avatarUrl }: ChatHeaderProps) => {
  return (
    <header className="flex items-center p-3 bg-[#111B21] text-white w-full">
      <button
        aria-label="Back"
        className="mr-3 flex items-center justify-center text-white"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <img
        src={avatarUrl}
        alt={name}
        className="h-8 w-8 rounded-full mr-3"
      />
      <span className="font-medium text-sm">{name}</span>
    </header>
  );
};

export default ChatHeader;
