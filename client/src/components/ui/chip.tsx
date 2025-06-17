// See CHANGELOG.md for 2025-06-17 [Added]
import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  onRemove?: () => void
}

export default function Chip({
  children,
  className,
  onRemove,
  ...props
}: ChipProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-4 py-1 text-sm text-gray-800',
        className,
      )}
      {...props}
    >
      <span className="mr-1">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 text-gray-500 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
