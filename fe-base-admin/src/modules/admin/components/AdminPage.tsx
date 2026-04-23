import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  UserPlus,
  ShieldOff,
  Pencil,
  X,
  Check,
  Users,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Eye,
  MoreHorizontal,
} from 'lucide-react'
import { Badge } from '@shared/components/ui/badge'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { DataTable, type ColumnDef } from '@shared/components/ui/data-table'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu'
import { FieldLabel, FieldError } from '@shared/components/ui/field'
import { cn } from '@shared/utils'
import { useAdmins, useAdminTableState, useCreateAdmin, useDeactivateAdmin, useUpdateAdminRole } from '../hooks/useAdmins'
import { AdminDetailModal } from './AdminDetailModal'
import type { Admin } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminRow = Admin & Record<string, unknown>

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: number | string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <Icon className="h-4 w-4 text-gray-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-900 leading-none mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ─── Form field helper ────────────────────────────────────────────────────────

function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <FieldLabel className="text-sm font-medium text-gray-700">{label}</FieldLabel>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
      <FieldError className="text-xs">{error}</FieldError>
    </div>
  )
}

// ─── Create admin modal ───────────────────────────────────────────────────────

const createSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Tối thiểu 8 ký tự'),
  role: z.string().optional(),
})
type CreateValues = z.infer<typeof createSchema>

function CreateAdminModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createAdmin = useCreateAdmin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateValues>({ resolver: zodResolver(createSchema) })

  const onSubmit = (values: CreateValues) =>
    createAdmin.mutate(values, { onSuccess: onClose })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0 rounded-2xl">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 pr-12">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900">
            <UserPlus className="h-4 w-4 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-gray-900">Tạo admin mới</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Tài khoản có hiệu lực ngay sau khi tạo
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5">
          <FormField label="Email" error={errors.email?.message}>
            <Input
              type="email"
              autoComplete="off"
              placeholder="admin@example.com"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
          </FormField>

          <FormField label="Mật khẩu" error={errors.password?.message}>
            <Input
              type="password"
              placeholder="Tối thiểu 8 ký tự"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
          </FormField>

          <FormField label="Role" hint="Để trống mặc định là admin">
            <Input placeholder="admin" {...register('role')} />
          </FormField>

          {createAdmin.isError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Tạo thất bại. Email có thể đã tồn tại.
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={createAdmin.isPending}
            >
              Huỷ
            </Button>
            <Button type="submit" className="flex-1" isLoading={createAdmin.isPending}>
              {createAdmin.isPending ? 'Đang tạo...' : 'Tạo admin'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Inline role editor ───────────────────────────────────────────────────────

function RoleEditor({ admin }: { admin: Admin }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(admin.role)
  const updateRole = useUpdateAdminRole()

  const save = () => {
    if (value.trim() && value !== admin.role) {
      updateRole.mutate(
        { id: admin.id, role: value.trim() },
        { onSuccess: () => setEditing(false) },
      )
    } else {
      setEditing(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
          {admin.role}
        </span>
        {admin.isActive && (
          <button
            onClick={() => setEditing(true)}
            className="rounded p-0.5 text-gray-300 transition-colors hover:text-gray-600"
            title="Đổi role"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') setEditing(false)
        }}
        className="h-7 w-28 rounded-md border border-gray-300 px-2 text-xs outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
      />
      <button
        onClick={save}
        disabled={updateRole.isPending}
        className="rounded p-0.5 text-green-600 transition-colors hover:text-green-700 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setEditing(false)}
        className="rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ─── Action dropdown ──────────────────────────────────────────────────────────

function ActionDropdown({ admin, onView }: { admin: Admin; onView: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const deactivate = useDeactivateAdmin()

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Xác nhận?</span>
          <button
            onClick={() =>
              deactivate.mutate(admin.id, {
                onSuccess: () => setConfirming(false),
                onError: (err: unknown) => {
                  const msg =
                    (err as { response?: { data?: { message?: string } } })?.response?.data
                      ?.message ?? 'Vô hiệu hóa thất bại'
                  setError(msg)
                },
              })
            }
            disabled={deactivate.isPending}
            className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {deactivate.isPending ? '...' : 'Vô hiệu'}
          </button>
          <button
            onClick={() => { setConfirming(false); setError(null) }}
            className="rounded px-1.5 py-0.5 text-xs text-gray-400 transition-colors hover:text-gray-600"
          >
            Huỷ
          </button>
        </div>
        {error && <p className="text-[10px] text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 data-[state=open]:bg-gray-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onView} className="gap-2">
            <Eye className="h-3.5 w-3.5" />
            Chi tiết
          </DropdownMenuItem>
          {admin.isActive && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirming(true)}
                className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-600"
              >
                <ShieldOff className="h-3.5 w-3.5" />
                Vô hiệu hoá
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ─── Column definitions ───────────────────────────────────────────────────────

function buildColumns(onView: (admin: Admin) => void): ColumnDef<AdminRow>[] {
  return [
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-medium text-gray-900">{row.email as string}</p>
          <p className="text-xs text-gray-400 font-mono">{(row.id as string).slice(0, 8)}…</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      filterable: true,
      filterType: 'text',
      width: '160px',
      render: (_, row) => <RoleEditor admin={row as unknown as Admin} />,
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
      width: '120px',
      render: (value) => {
        const active = value === true
        return (
          <Badge
            className={cn(
              'text-[11px] font-medium border-0',
              active
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500',
            )}
          >
            <span
              className={cn(
                'mr-1.5 inline-block h-1.5 w-1.5 rounded-full',
                active ? 'bg-white/70' : 'bg-gray-400',
              )}
            />
            {active ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      sortable: true,
      width: '130px',
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
        <ActionDropdown
          admin={row as unknown as Admin}
          onView={() => onView(row as unknown as Admin)}
        />
      ),
    },
  ]
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminPage() {
  const { state, setPage, setPageSize, setSort, setSearch, setFilters } = useAdminTableState()
  const { data, isLoading, isError } = useAdmins(state)
  const [showModal, setShowModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)

  const admins = data?.data ?? []
  const meta = data?.meta
  const columns = buildColumns(setSelectedAdmin)

  return (
    <div className="space-y-6 p-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý tài khoản quản trị hệ thống
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 shrink-0">
          <UserPlus className="h-4 w-4" />
          Tạo admin mới
        </Button>
      </div>

      {/* ── Stat cards ── */}
      {!isError && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={Users} label="Tổng admin" value={isLoading ? '—' : (meta?.totalItems ?? 0)} />
          <StatCard icon={ShieldCheck} label="Đang hoạt động" value={isLoading ? '—' : admins.filter(a => a.isActive).length} />
          <StatCard icon={ShieldX} label="Đã vô hiệu hoá" value={isLoading ? '—' : admins.filter(a => !a.isActive).length} />
        </div>
      )}

      {/* ── Error state ── */}
      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Không thể tải danh sách admin. Vui lòng thử lại.
        </div>
      )}

      {/* ── DataTable (server-side) ── */}
      {!isError && (
        <DataTable<AdminRow>
          columns={columns}
          data={admins as AdminRow[]}
          loading={isLoading}
          rowKey="id"
          emptyText="Chưa có admin nào"
          searchable
          searchPlaceholder="Tìm theo email, role..."
          total={meta?.totalItems}
          page={state.page}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onSort={setSort}
          onSearch={setSearch}
          onFilter={setFilters}
        />
      )}

      {/* ── Create modal ── */}
      <CreateAdminModal open={showModal} onClose={() => setShowModal(false)} />

      {/* ── Detail modal ── */}
      <AdminDetailModal
        admin={selectedAdmin}
        open={!!selectedAdmin}
        onClose={() => setSelectedAdmin(null)}
      />
    </div>
  )
}
