import { useState } from 'react'
import { Bell, Send } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { DataTable, useDataTable, type ColumnDef } from '@shared/components/ui/data-table'
import { useSentNotifications } from '../hooks/useSentNotifications'
import { SendNotificationModal } from './SendNotificationModal'
import type { NotificationType, SentNotification } from '../types'

type SentRow = SentNotification & Record<string, unknown>

const TYPE_BADGE: Record<
  NotificationType,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  info:    { label: 'Info',    variant: 'default'     },
  success: { label: 'Success', variant: 'secondary'   },
  warning: { label: 'Warning', variant: 'outline'     },
  alert:   { label: 'Alert',   variant: 'destructive' },
  system:  { label: 'System',  variant: 'secondary'   },
}

const columns: ColumnDef<SentRow>[] = [
  {
    key: 'title',
    header: 'Tiêu đề',
    render: (_, row) => (
      <div>
        <p className="font-medium">{row.title as string}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{row.body as string}</p>
      </div>
    ),
  },
  {
    key: 'type',
    header: 'Loại',
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'Info',    value: 'info'    },
      { label: 'Success', value: 'success' },
      { label: 'Warning', value: 'warning' },
      { label: 'Alert',   value: 'alert'   },
      { label: 'System',  value: 'system'  },
    ],
    width: '110px',
    render: (value) => {
      const cfg = TYPE_BADGE[value as NotificationType] ?? TYPE_BADGE.info
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>
    },
  },
  {
    key: 'recipientSummary',
    header: 'Gửi đến',
    width: '140px',
    render: (_, row) => {
      const s = row.recipientSummary as { adminCount: number; userCount: number }
      const parts: string[] = []
      if (s.adminCount > 0) parts.push(`${s.adminCount} admin`)
      if (s.userCount > 0) parts.push(`${s.userCount} user`)
      return (
        <span className="text-sm text-muted-foreground">
          {parts.length > 0 ? parts.join(', ') : '—'}
        </span>
      )
    },
  },
  {
    key: 'senderType',
    header: 'Người gửi',
    width: '180px',
    render: (value, row) => {
      if (value === 'system') {
        return <span className="text-xs text-muted-foreground">System</span>
      }
      const email = row.senderEmail as string | null
      return (
        <span className="text-sm">
          {email ?? <span className="text-muted-foreground">Admin</span>}
        </span>
      )
    },
  },
  {
    key: 'createdAt',
    header: 'Thời gian',
    sortable: true,
    filterable: true,
    filterType: 'date-range',
    width: '150px',
    className: 'text-muted-foreground text-xs',
    render: (value) => format(new Date(value as string), 'dd/MM/yyyy HH:mm'),
  },
]

export function NotificationPage() {
  const [sendOpen, setSendOpen] = useState(false)

  const table = useDataTable<SentRow>({
    tableId: 'notification-sent',
    showSearch: true,
    searchPlaceholder: 'Tìm theo tiêu đề, nội dung...',
    showFilters: true,
    showColumnVisibility: true,
    showRefreshButton: true,
    persistPageSize: true,
    persistFilters: true,
    persistSort: true,
    syncToUrl: true,
  })

  const { data, isLoading, refetch } = useSentNotifications(
    table.buildQueryParams(['title', 'body']),
  )

  const items = (data?.data ?? []) as SentRow[]
  const meta = data?.meta

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="size-6 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold">Notifications</h1>
            <p className="text-sm text-muted-foreground">Gửi và quản lý thông báo hệ thống</p>
          </div>
        </div>
        <Button onClick={() => setSendOpen(true)}>
          <Send className="mr-2 size-4" />
          Gửi thông báo
        </Button>
      </div>

      <DataTable<SentRow>
        columns={columns}
        data={items}
        loading={isLoading}
        rowKey="id"
        emptyText="Chưa có thông báo nào được gửi"
        table={table}
        total={meta?.totalItems}
        onRefresh={refetch}
      />

      <SendNotificationModal open={sendOpen} onClose={() => setSendOpen(false)} />
    </div>
  )
}
