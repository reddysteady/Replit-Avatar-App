// See CHANGELOG.md for 2025-06-09 [Added]
// See CHANGELOG.md for 2025-06-10 [Added]
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Mail, 
  MessageSquare, 
  Settings, 
  BarChart2, 
  Calendar,
  Code,
  Lock,
} from "lucide-react";

type SidebarProps = {
  className?: string;
};

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
};

const NavItem = ({ href, icon, children, active }: NavItemProps) => {
  return (
    <Link href={href}>
      <a className={cn(
        "flex items-center px-2 py-2 text-sm font-medium rounded-md",
        active
          ? "bg-blue-600 text-white"
          : "text-neutral-700 hover:bg-neutral-100"
      )}>
        <span className={cn(
          "h-5 w-5 mr-3",
          active ? "text-white" : "text-neutral-500"
        )}>
          {icon}
        </span>
        {children}
      </a>
    </Link>
  );
};

const Sidebar = ({ className }: SidebarProps) => {
  const [location] = useLocation();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-neutral-200">
        <div className="h-0 flex-1 flex flex-col">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-b border-neutral-200">
            <h1 className="text-lg font-semibold text-neutral-900">Avatar</h1>
            <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700">Beta</span>
          </div>
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto bg-white">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              <NavItem 
                href="/instagram" 
                icon={<MessageSquare />} 
                active={location === "/" || location === "/instagram" || location === "/youtube"}
              >
                Messages
              </NavItem>
              <NavItem 
                href="/connect/instagram" 
                icon={<Mail />} 
                active={location === "/connect/instagram"}
              >
                Connect Instagram
              </NavItem>
              <NavItem 
                href="/settings" 
                icon={<Settings />} 
                active={location === "/settings"}
              >
                Settings
              </NavItem>
              <NavItem 
                href="/analytics" 
                icon={<BarChart2 />} 
                active={location === "/analytics"}
              >
                Analytics
              </NavItem>
              <NavItem 
                href="/automation" 
                icon={<Calendar />} 
                active={location === "/automation"}
              >
                Automation Rules
              </NavItem>
              {/* Testing tools page for generating sample data and debugging */}
              <NavItem
                href="/testing"
                icon={<Code />}
                active={location === "/testing"}
              >
                Testing Tools
              </NavItem>
              <NavItem
                href="/privacy"
                icon={<Lock />}
                active={location === "/privacy"}
              >
                Privacy Policy
              </NavItem>


            </nav>
          </div>
          <div className="p-4 border-t border-neutral-200 bg-white">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  className="h-8 w-8 rounded-full" 
                  src="https://avatars.githubusercontent.com/u/1" 
                  alt="User profile" 
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-700 truncate">Sarah Connor</p>
                <p className="text-xs font-medium text-neutral-500 truncate">sarah@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
