// See CHANGELOG.md for 2025-06-12 [Changed]
import React, { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Menu } from "lucide-react";
// Using simple image tag to ensure SSR markup includes the URL

type ChatHeaderProps = {
  name?: string;
  avatarUrl?: string;
  onBack?: () => void;
};

const ChatHeader = ({ name = "", avatarUrl = "", onBack }: ChatHeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="md:hidden flex items-center justify-between p-3 bg-[#111B21] text-white w-full">
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
          {name && <span className="font-medium text-sm">{name}</span>}
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
        <div className="md:hidden bg-[#111B21] text-white pb-3 pt-2 border-b border-neutral-700 space-y-1">
          <Link href="/instagram">
            <a className="block px-4 py-2 text-base">Instagram DMs</a>
          </Link>
          <Link href="/youtube">
            <a className="block px-4 py-2 text-base">YouTube Comments</a>
          </Link>
          <Link href="/settings">
            <a className="block px-4 py-2 text-base">Settings</a>
          </Link>
          <Link href="/analytics">
            <a className="block px-4 py-2 text-base">Analytics</a>
          </Link>
          <Link href="/automation">
            <a className="block px-4 py-2 text-base">Automation Rules</a>
          </Link>
        </div>
      )}
    </>
  );
};

export default ChatHeader;
