import { useState } from 'react'
import { Mail, Eye, MessageSquare, Clock, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@shared/components/ui/badge'
import { Button } from '@shared/components/ui/button'
import { DataTable, useDataTable, type ColumnDef } from '@shared/components/ui/data-table'
import { cn } from '@shared/utils'
import { useContactList } from '../hooks/useContacts'
import { ContactDetailDialog } from './ContactDetailDialog'
import type { Contact, ContactStatus } from '../types'

type ContactRow = Contact & Record<string, unknown>

const STATUS_COLORS: Record<ContactStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  READ: 'bg-blue-100 text-blue-700',
  RESPONDED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
}

const STATUS_OPTIONS = [
  { label: 'Chờ xử lý', value: 'PENDING' },
  { label: 'Đã đọc', value: 'READ' },
  { label: 'Đã phản hồi', value: 'RESPONDED' },
  { label: 'Đã đóng', value: 'CLOSED' },
]

function buildColumns(onView: (contact: Contact) => void): ColumnDef<ContactRow>[] {
  return [
    {
      key: 'fullName',
      header: 'Người gửi',
      render: (_, row) => (
        <div>
          <p className="font-medium text-gray-900">{row.fullName as string}</p>
          <p className="text-xs text-gray-400">{row.email as string}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Chủ đề',
      render: (value) => (
        <span className="text-sm text-gray-700 line-clamp-1">{value as string}</span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: STATUS_OPTIONS,
      width: '130px',
      render: (value) => {
        const status = value as ContactStatus
        return (
          <Badge
            className={cn(
              'text-[11px] font-medium border-0',
              STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600',
            )}
          >
            {STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status}
          </Badge>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'Ngày gửi',
      sortable: true,
      width: '110px',
      className: 'text-gray-500 text-xs',
      render: (value) =>
        new Date(value as string).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
    },
    {
      key: 'actions',
      header: '',
      width: '56px',
      render: (_, row) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation()
              onView(row as unknown as Contact)
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]
}

export function ContactsPage() {
  const { t } = useTranslation()
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)

  const table = useDataTable<ContactRow>({
    tableId: 'contacts',
    showSearch: true,
    searchPlaceholder: t('contacts.searchPlaceholder', {
      defaultValue: 'Tìm theo tên, email, chủ đề...',
    }),
    showFilters: true,
    showColumnVisibility: true,
    showDensityToggle: true,
    showRefreshButton: true,
    syncToUrl: true,
    persistPageSize: true,
    persistFilters: true,
    persistSort: true,
  })

  const { data, isLoading, isError, refetch } = useContactList(
    table.buildQueryParams(['firstName', 'lastName', 'email', 'subject']),
  )

  const contacts = data?.data ?? []
  const meta = data?.meta

  const pendingCount = contacts.filter((c) => c.status === 'PENDING').length
  const respondedCount = contacts.filter((c) => c.status === 'RESPONDED').length

  const columns = buildColumns((contact) => setSelectedContactId(contact.id))

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('contacts.title', { defaultValue: 'Liên hệ' })}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('contacts.subtitle', { defaultValue: 'Quản lý form liên hệ từ người dùng' })}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      {!isError && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              label: t('contacts.totalContacts', { defaultValue: 'Tổng liên hệ' }),
              value: isLoading ? '—' : (meta?.totalItems ?? 0),
              icon: Mail,
            },
            {
              label: t('contacts.pendingContacts', { defaultValue: 'Chờ xử lý' }),
              value: isLoading ? '—' : pendingCount,
              icon: Clock,
            },
            {
              label: t('contacts.responded', { defaultValue: 'Đã phản hồi' }),
              value: isLoading ? '—' : respondedCount,
              icon: MessageSquare,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <Icon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-semibold text-gray-900 leading-none mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {isError ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {t('contacts.loadError', {
            defaultValue: 'Không thể tải danh sách liên hệ. Vui lòng thử lại.',
          })}
        </div>
      ) : (
        <DataTable<ContactRow>
          columns={columns}
          data={contacts as ContactRow[]}
          loading={isLoading}
          rowKey="id"
          emptyText={t('contacts.empty', { defaultValue: 'Chưa có liên hệ nào' })}
          table={table}
          total={meta?.totalItems}
          onRefresh={refetch}
        />
      )}

      {/* Detail dialog */}
      <ContactDetailDialog
        contactId={selectedContactId}
        onClose={() => setSelectedContactId(null)}
      />
    </div>
  )
}
