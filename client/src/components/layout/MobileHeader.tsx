
// See CHANGELOG.md for 2025-06-12 [Changed - mobile header integrates menu]
import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const MobileHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-10">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-lg font-semibold text-neutral-900">Avatar</h1>
          <Button 
            variant="ghost" 
            className="p-2 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none" 
            onClick={toggleMenu}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        
        {isMenuOpen && (
          <div className="bg-white pb-3 pt-2 border-b border-neutral-200 space-y-1">
            <Link href="/instagram">
              <a className={cn(
                "block px-4 py-2 text-base font-medium",
                (location === "/" || location === "/instagram") 
                  ? "bg-primary-50 text-primary-700" 
                  : "text-neutral-700 hover:bg-neutral-100"
              )}>
                Instagram DMs
              </a>
            </Link>
            <Link href="/youtube">
              <a className={cn(
                "block px-4 py-2 text-base font-medium",
                location === "/youtube" 
                  ? "bg-primary-50 text-primary-700" 
                  : "text-neutral-700 hover:bg-neutral-100"
              )}>
                YouTube Comments
              </a>
            </Link>
            <Link href="/settings">
              <a className={cn(
                "block px-4 py-2 text-base font-medium",
                location === "/settings" 
                  ? "bg-primary-50 text-primary-700" 
                  : "text-neutral-700 hover:bg-neutral-100"
              )}>
                Settings
              </a>
            </Link>
            <Link href="/analytics">
              <a className={cn(
                "block px-4 py-2 text-base font-medium",
                location === "/analytics" 
                  ? "bg-primary-50 text-primary-700" 
                  : "text-neutral-700 hover:bg-neutral-100"
              )}>
                Analytics
              </a>
            </Link>
            <Link href="/automation">
              <a className={cn(
                "block px-4 py-2 text-base font-medium",
                location === "/automation" 
                  ? "bg-primary-50 text-primary-700" 
                  : "text-neutral-700 hover:bg-neutral-100"
              )}>
                Automation Rules
              </a>
            </Link>
            <Link href="/testing">
              <a className={cn(
                "block px-4 py-2 text-base font-medium",
                location === "/testing" 
                  ? "bg-primary-50 text-primary-700" 
                  : "text-neutral-700 hover:bg-neutral-100"
              )}>
                Testing Tools
              </a>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileHeader;
