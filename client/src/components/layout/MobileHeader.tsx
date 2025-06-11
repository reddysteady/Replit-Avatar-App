// See CHANGELOG.md for 2025-06-10 [Fixed]
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MobileHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuItemClick = () => {
    setIsMenuOpen(false);
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
              <a
                onClick={handleMenuItemClick}
                className={cn(
                "block px-4 py-2 text-base font-medium",
                (location === "/" || location === "/instagram")
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-700 hover:bg-neutral-100"
              )}>
                Instagram DMs
              </a>
            </Link>
            <Link href="/youtube">
              <a
                onClick={handleMenuItemClick}
                className={cn(
                "block px-4 py-2 text-base font-medium",
                location === "/youtube"
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-700 hover:bg-neutral-100"
              )}>
                YouTube Comments
              </a>
            </Link>
            <Link href="/settings">
              <a
                onClick={handleMenuItemClick}
                className={cn(
                "block px-4 py-2 text-base font-medium",
                location === "/settings"
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-700 hover:bg-neutral-100"
              )}>
                Settings
              </a>
            </Link>
            <Link href="/analytics">
              <a
                onClick={handleMenuItemClick}
                className={cn(
                "block px-4 py-2 text-base font-medium",
                location === "/analytics"
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-700 hover:bg-neutral-100"
              )}>
                Analytics
              </a>
            </Link>
            <Link href="/automation">
              <a
                onClick={handleMenuItemClick}
                className={cn(
                "block px-4 py-2 text-base font-medium",
                location === "/automation"
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-700 hover:bg-neutral-100"
              )}>
                Automation Rules
              </a>
            </Link>
            
            <div className="pt-4 pb-3 border-t border-neutral-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <img 
                    className="h-10 w-10 rounded-full" 
                    src="https://avatars.githubusercontent.com/u/1" 
                    alt="User profile"
                  />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-neutral-800">Sarah Connor</div>
                  <div className="text-sm font-medium text-neutral-500">sarah@example.com</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileHeader;
