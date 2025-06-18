import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavItemProps {
  to: string
  children: React.ReactNode
  icon?: React.ReactNode
  activePaths: string[]
  className?: string
  onClick?: () => void
}

export const NavItem = ({
  to,
  children,
  icon,
  activePaths,
  className,
  onClick,
}: NavItemProps) => {
  const location = useLocation()
  const active = activePaths.includes(location.pathname)
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'flex items-center px-4 py-2 text-base font-medium',
        active ? 'text-blue-500' : 'text-neutral-700 hover:text-neutral-900',
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            'mr-3 h-5 w-5',
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