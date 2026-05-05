import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  Info,
  Settings2,
  Trash2,
} from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Separator } from '@shared/components/ui/separator'
import { Spinner } from '@shared/components/ui/spinner'
import { useMyNotifications } from '../hooks/useMyNotifications'
import { useMarkAsRead } from '../hooks/useMarkAsRead'
import { useMarkAllAsRead } from '../hooks/useMarkAllAsRead'
import { useDeleteNotification } from '../hooks/useDeleteNotification'
import type { NotificationType } from '../types'

const typeConfig: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; dot: string; iconCls: string }
> = {
  info:    { icon: Info,          dot: 'bg-blue-500',   iconCls: 'text-blue-500'   },
  success: { icon: CheckCircle2,  dot: 'bg-green-500',  iconCls: 'text-green-500'  },
  warning: { icon: AlertTriangle, dot: 'bg-yellow-500', iconCls: 'text-yellow-500' },
  alert:   { icon: AlertCircle,   dot: 'bg-red-500',    iconCls: 'text-red-500'    },
  system:  { icon: Settings2,     dot: 'bg-gray-400',   iconCls: 'text-gray-400'   },
}

export function NotificationDropdown() {
  const { data, isLoading } = useMyNotifications({ limit: 10 })
  const { mutate: markAsRead } = useMarkAsRead()
  const { mutate: markAll, isPending: markingAll } = useMarkAllAsRead()
  const { mutate: del } = useDeleteNotification()

  const items = data?.data ?? []
  const hasUnread = items.some((n) => !n.isRead)

  return (
    <div className="flex w-[380px] flex-col" style={{ maxHeight: 500 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-foreground">Thông báo</span>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            disabled={markingAll}
            onClick={() => markAll()}
          >
            <CheckCheck className="size-3.5" />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      <Separator />

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center py-10">
            <Spinner className="size-5" />
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <Bell className="size-8 opacity-30" />
            <p className="text-sm">Không có thông báo</p>
          </div>
        )}

        {items.map((item) => {
          const cfg = typeConfig[item.type] ?? typeConfig.info
          const Icon = cfg.icon
          return (
            <div
              key={item.id}
              className={`group relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
                !item.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
              }`}
            >
              {/* Type icon */}
              <div className="mt-0.5 shrink-0">
                <Icon className={`size-4 ${cfg.iconCls}`} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm leading-snug ${!item.isRead ? 'font-semibold' : 'font-medium'}`}>
                    {item.title}
                  </p>
                  {!item.isRead && (
                    <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${cfg.dot}`} />
                  )}
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {item.body}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })}
                </p>
              </div>

              {/* Actions — show on hover */}
              <div className="absolute right-3 top-3 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                {!item.isRead && (
                  <button
                    onClick={() => markAsRead(item.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Đánh dấu đã đọc"
                  >
                    <Check className="size-3.5" />
                  </button>
                )}
                <button
                  onClick={() => del(item.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                  title="Xóa"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
