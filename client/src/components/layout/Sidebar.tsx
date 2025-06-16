// See CHANGELOG.md for 2025-06-09 [Added]
// See CHANGELOG.md for 2025-06-10 [Added]
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  Settings,
  BarChart2,
  FlaskConical,
  Lock,
} from 'lucide-react'

type SidebarProps = {
  className?: string
}

type NavItemProps = {
  to: string
  icon?: React.ReactNode
  children: React.ReactNode
  active?: boolean
  className?: string
}

const NavItem = ({ to, icon, children, active, className }: NavItemProps) => {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center px-2 py-2 text-sm font-medium rounded-md',
        active ? 'text-blue-500' : 'text-neutral-700 hover:text-neutral-900',
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            'h-5 w-5 mr-3',
            active ? 'text-[#FF7300]' : 'text-neutral-500',
          )}
        >
          {icon}
        </span>
      )}
      {children}
    </Link>
  )
}

const Sidebar = ({ className }: SidebarProps) => {
  const location = useLocation()

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-neutral-200">
        <div className="h-0 flex-1 flex flex-col">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-b border-neutral-200">
            <h1 className="text-lg font-semibold text-neutral-900">Avatar</h1>
            <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
              Beta
            </span>
          </div>
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto bg-white">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              <NavItem
                to="/"
                icon={<MessageSquare />}
                active={
                  location.pathname === '/' ||
                  location.pathname === '/instagram' ||
                  location.pathname === '/youtube'
                }
              >
                Conversations
              </NavItem>
              <NavItem
                to="/analytics"
                icon={<BarChart2 />}
                active={location.pathname === '/analytics'}
              >
                Insights
              </NavItem>
              <NavItem
                to="/settings"
                icon={<Settings />}
                active={location.pathname === '/settings'}
              >
                Settings
              </NavItem>
              <NavItem
                to="/settings/sources"
                active={location.pathname === '/settings/sources'}
                className="pl-8"
              >
                Content Sources
              </NavItem>
              <NavItem
                to="/settings/persona"
                active={location.pathname === '/settings/persona'}
                className="pl-8"
              >
                Persona
              </NavItem>
              <NavItem
                to="/settings/ai"
                active={location.pathname === '/settings/ai'}
                className="pl-8"
              >
                AI Settings
              </NavItem>
              <NavItem
                to="/settings/automation"
                active={location.pathname === '/settings/automation'}
                className="pl-8"
              >
                Automation
              </NavItem>
              <NavItem
                to="/settings/notifications"
                active={location.pathname === '/settings/notifications'}
                className="pl-8"
              >
                Notifications
              </NavItem>
              <NavItem
                to="/settings/api"
                active={location.pathname === '/settings/api'}
                className="pl-8"
              >
                API Keys
              </NavItem>
              <NavItem
                to="/settings/testing-tools"
                icon={<FlaskConical />}
                active={location.pathname === '/settings/testing-tools'}
              >
                Testing Tools
              </NavItem>
              <NavItem
                to="/settings/privacy"
                icon={<Lock />}
                active={location.pathname === '/settings/privacy'}
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
                <p className="text-sm font-medium text-neutral-700 truncate">
                  Sarah Connor
                </p>
                <p className="text-xs font-medium text-neutral-500 truncate">
                  sarah@example.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
