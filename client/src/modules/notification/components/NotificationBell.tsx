'use client'

import { Bell } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover'
import { useUnreadCount } from '../hooks/useUnreadCount'
import { useNotificationSocket } from '../hooks/useNotificationSocket'
import { NotificationDropdown } from './NotificationDropdown'

export function NotificationBell() {
  useNotificationSocket()

  const { data } = useUnreadCount()
  const count = data?.count ?? 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell className="size-5" />
          {count > 0 && (
            <span className="absolute right-0.5 top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white leading-[18px]">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-auto p-0 shadow-lg">
        <NotificationDropdown />
      </PopoverContent>
    </Popover>
  )
}
