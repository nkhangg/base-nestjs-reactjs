import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { adminService } from '../services/admin.service'
import {
  Key,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  AlertTriangle,
  Shield,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@shared/components/ui/sheet'
import { Skeleton } from '@shared/components/ui/skeleton'
import { Spinner } from '@shared/components/ui/spinner'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@shared/components/ui/empty'
import { FieldLabel, FieldError } from '@shared/components/ui/field'
import { cn } from '@shared/utils'
import {
  useRoles,
  useRole,
  useRoleResources,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '../hooks/useRoles'
import type { Action, CreateRoleDto, Role, RoleDetail, SubjectType, UpdateRoleDto } from '../types'
import { ALL_ACTIONS } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECT_TYPE_OPTIONS: { label: string; value: SubjectType }[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'User', value: 'user' },
  { label: 'Merchant', value: 'merchant' },
  { label: 'Tất cả (*)', value: '*' },
]

const ACTION_LABELS: Record<Action, string> = {
  create: 'Create',
  read: 'Read',
  update: 'Update',
  delete: 'Delete',
  publish: 'Publish',
  approve: 'Approve',
  export: 'Export',
}

const SUBJECT_COLORS: Record<SubjectType, string> = {
  admin: 'bg-violet-100 text-violet-700',
  user: 'bg-blue-100 text-blue-700',
  merchant: 'bg-amber-100 text-amber-700',
  '*': 'bg-gray-100 text-gray-600',
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

// ─── Permissions editor ───────────────────────────────────────────────────────

interface PermissionsEditorProps {
  value: Record<string, Action[]>
  onChange: (v: Record<string, Action[]>) => void
  suggestedResources?: string[]
}

function PermissionsEditor({ value, onChange, suggestedResources = [] }: PermissionsEditorProps) {
  const [newResource, setNewResource] = useState('')

  const addResource = (name: string) => {
    const r = name.trim()
    if (!r || value[r]) return
    onChange({ ...value, [r]: [] })
    setNewResource('')
  }

  const removeResource = (resource: string) => {
    const next = { ...value }
    delete next[resource]
    onChange(next)
  }

  const toggleAction = (resource: string, action: Action) => {
    const current = value[resource] ?? []
    const next = current.includes(action)
      ? current.filter((a) => a !== action)
      : [...current, action]
    onChange({ ...value, [resource]: next })
  }

  const toggleAll = (resource: string) => {
    const current = value[resource] ?? []
    onChange({
      ...value,
      [resource]: current.length === ALL_ACTIONS.length ? [] : [...ALL_ACTIONS],
    })
  }

  const available = ['*', ...suggestedResources].filter(
    (r) => !Object.keys(value).includes(r),
  )

  return (
    <div className="space-y-3">
      {available.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-gray-400">
            Resources có sẵn — click để thêm
          </p>
          <div className="flex flex-wrap gap-1.5">
            {available.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => addResource(r)}
                className="rounded-full border border-dashed border-gray-300 bg-white px-2.5 py-0.5 font-mono text-[11px] text-gray-500 transition-colors hover:border-gray-900 hover:text-gray-900"
              >
                + {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {Object.entries(value).length === 0 && (
        <p className="py-2 text-center text-xs text-gray-400">
          Chưa có permission nào.
        </p>
      )}
      {Object.entries(value).map(([resource, actions]) => {
        const allChecked = actions.length === ALL_ACTIONS.length
        return (
          <div key={resource} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-700">
                  {resource}
                </span>
                <button
                  type="button"
                  onClick={() => toggleAll(resource)}
                  className="text-[10px] text-gray-400 underline hover:text-gray-700"
                >
                  {allChecked ? 'Bỏ tất cả' : 'Chọn tất cả'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeResource(resource)}
                className="rounded p-0.5 text-gray-300 transition-colors hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_ACTIONS.map((action) => {
                const checked = actions.includes(action)
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={() => toggleAction(resource, action)}
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                      checked
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-gray-400',
                    )}
                  >
                    {ACTION_LABELS[action]}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="flex gap-2">
        <Input
          placeholder="Nhập tên resource tuỳ chỉnh..."
          value={newResource}
          onChange={(e) => setNewResource(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addResource(newResource) }
          }}
          className="h-8 text-sm"
        />
        <Button type="button" variant="secondary" size="sm" onClick={() => addResource(newResource)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Create / Edit modal ──────────────────────────────────────────────────────

const roleSchema = z.object({
  name: z.string().min(1, 'Tên role không được trống'),
  subjectType: z.enum(['admin', 'user', 'merchant', '*']),
  description: z.string().optional(),
  parentId: z.string().optional(),
})
type RoleFormValues = z.infer<typeof roleSchema>

function RoleFormModal({
  open,
  initial,
  roles,
  suggestedResources,
  onClose,
}: {
  open: boolean
  initial?: RoleDetail
  roles: Role[]
  suggestedResources?: string[]
  onClose: () => void
}) {
  const isEdit = !!initial
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const [permissions, setPermissions] = useState<Record<string, Action[]>>(
    initial
      ? Object.fromEntries(initial.permissions.map((p: { resource: string; actions: Action[] }) => [p.resource, p.actions]))
      : {},
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: initial?.name ?? '',
      subjectType: initial?.subjectType ?? 'admin',
      description: initial?.description ?? '',
      parentId: initial?.parentId ?? undefined,
    },
  })

  const selectedSubjectType = watch('subjectType')
  const parentOptions = roles.filter(
    (r) =>
      r.subjectType === selectedSubjectType &&
      r.id !== initial?.id,
  )

  const onSubmit = (values: RoleFormValues) => {
    if (isEdit && initial) {
      const dto: UpdateRoleDto = {
        description: values.description,
        parentId: values.parentId ?? null,
        permissions,
      }
      updateRole.mutate({ id: initial.id, dto }, { onSuccess: onClose })
    } else {
      const dto: CreateRoleDto = {
        name: values.name,
        subjectType: values.subjectType as SubjectType,
        description: values.description,
        parentId: values.parentId || undefined,
        permissions,
      }
      createRole.mutate(dto, { onSuccess: onClose })
    }
  }

  const isPending = createRole.isPending || updateRole.isPending
  const isError = createRole.isError || updateRole.isError

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg gap-0 p-0 rounded-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 pr-12 shrink-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900">
            <Key className="h-4 w-4 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-gray-900">
              {isEdit ? 'Sửa role' : 'Tạo role mới'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {isEdit ? `Chỉnh sửa "${initial!.name}"` : 'Tạo role và gán permissions'}
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tên role" error={errors.name?.message}>
              <Input
                placeholder="super-admin"
                disabled={isEdit}
                {...register('name')}
              />
            </FormField>

            <FormField label="Subject type" error={errors.subjectType?.message}>
              <Select
                defaultValue={initial?.subjectType ?? 'admin'}
                disabled={isEdit}
                onValueChange={(v) => setValue('subjectType', v as SubjectType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Mô tả" hint="Tuỳ chọn">
            <Input placeholder="Mô tả ngắn về role" {...register('description')} />
          </FormField>

          <FormField label="Parent role" hint="Kế thừa permissions từ role cha">
            <Select
              defaultValue={initial?.parentId ?? '__none__'}
              onValueChange={(v) => setValue('parentId', v === '__none__' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Không có" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Không có</SelectItem>
                {parentOptions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="space-y-1.5">
            <FieldLabel className="text-sm font-medium text-gray-700">Permissions</FieldLabel>
            <PermissionsEditor
              value={permissions}
              onChange={setPermissions}
              suggestedResources={suggestedResources}
            />
          </div>

          {isError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {isEdit ? 'Cập nhật thất bại.' : 'Tạo role thất bại. Tên role có thể đã tồn tại.'}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={isPending}>
              Huỷ
            </Button>
            <Button type="submit" className="flex-1" isLoading={isPending}>
              {isEdit ? 'Lưu thay đổi' : 'Tạo role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Role Detail Panel ────────────────────────────────────────────────────────

function RoleDetailPanel({
  roleId,
  open,
  roles,
  onEdit,
  onClose,
}: {
  roleId: string | null
  open: boolean
  roles: Role[]
  onEdit: (detail: RoleDetail) => void
  onClose: () => void
}) {
  const { data, isLoading } = useRole(roleId ?? '')

  const parentRole = data ? roles.find((r) => r.id === data.parentId) : undefined

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full max-w-md p-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 pr-12 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <SheetTitle className="text-sm font-semibold text-gray-900">Chi tiết role</SheetTitle>
              {data && (
                <SheetDescription className="text-xs text-gray-400">{data.name}</SheetDescription>
              )}
            </div>
          </div>
          {data && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => onEdit(data)}
            >
              <Pencil className="h-3 w-3" />
              Sửa
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="size-6 text-gray-400" />
          </div>
        ) : data ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Subject Type</p>
                <span className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium', SUBJECT_COLORS[data.subjectType])}>
                  {data.subjectType}
                </span>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Parent Role</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {parentRole ? parentRole.name : <span className="text-gray-400">—</span>}
                </p>
              </div>
            </div>

            {data.description && (
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Mô tả</p>
                <p className="text-sm text-gray-700">{data.description}</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Permissions ({data.permissions.length})
              </p>
              {data.permissions.length === 0 ? (
                <p className="text-sm text-gray-400">Không có permission nào</p>
              ) : (
                <div className="space-y-2">
                  {data.permissions.map((p: { id: string; resource: string; actions: Action[] }) => (
                    <div key={p.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="mb-2 flex items-center gap-1.5">
                        <ChevronRight className="h-3 w-3 text-gray-400" />
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700">
                          {p.resource}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.actions.map((a: Action) => (
                          <span
                            key={a}
                            className="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-medium text-white"
                          >
                            {ACTION_LABELS[a]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
            Không tìm thấy role
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ role, open, onClose }: { role: Role | null; open: boolean; onClose: () => void }) {
  const deleteRole = useDeleteRole()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm gap-0 p-0 rounded-2xl">
        {role && (
          <div className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Xoá role "{role.name}"?
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm text-gray-500">
              Tất cả assignments sẽ bị xoá. Hành động này không thể hoàn tác.
            </DialogDescription>
            {deleteRole.isError && (
              <p className="mt-2 text-xs text-red-500">Xoá thất bại. Vui lòng thử lại.</p>
            )}
            <div className="mt-5 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={onClose} disabled={deleteRole.isPending}>
                Huỷ
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                isLoading={deleteRole.isPending}
                onClick={() => deleteRole.mutate(role.id, { onSuccess: onClose })}
              >
                Xoá
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Role card ────────────────────────────────────────────────────────────────

function RoleCard({
  role,
  roles,
  onView,
  onEdit,
  onDelete,
}: {
  role: Role
  roles: Role[]
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const parent = roles.find((r) => r.id === role.parentId)

  return (
    <div
      className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <ShieldCheck className="h-4 w-4 text-gray-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{role.name}</p>
            {role.description && (
              <p className="mt-0.5 text-xs text-gray-500 truncate">{role.description}</p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', SUBJECT_COLORS[role.subjectType])}>
                {role.subjectType}
              </span>
              {parent && (
                <span className="text-[10px] text-gray-400">
                  ↳ kế thừa từ <span className="font-medium text-gray-600">{parent.name}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            title="Sửa"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Xoá"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function RolePage() {
  const [subjectTypeFilter, setSubjectTypeFilter] = useState<SubjectType | undefined>('admin')
  const { data: rolesResponse, isLoading, isError } = useRoles(subjectTypeFilter)
  const roles: Role[] = rolesResponse?.data ?? []
  const { data: suggestedResources = [] } = useRoleResources()

  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<RoleDetail | null>(null)
  const [viewId, setViewId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Role Management</h1>
          <p className="mt-1 text-sm text-gray-500">Quản lý roles và permissions của hệ thống</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Tạo role mới
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Subject type:</span>
        <div className="flex gap-1.5">
          {([undefined, 'admin', 'user', 'merchant'] as (SubjectType | undefined)[]).map((t) => (
            <button
              key={t ?? 'all'}
              onClick={() => setSubjectTypeFilter(t)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                subjectTypeFilter === t
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {t ?? 'Tất cả'}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Không thể tải danh sách roles.
        </div>
      )}

      {/* Role grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <Empty className="border-2 py-16">
          <EmptyMedia variant="icon">
            <Key className="h-8 w-8 text-gray-300" />
          </EmptyMedia>
          <EmptyTitle className="text-sm font-medium text-gray-500">Chưa có role nào</EmptyTitle>
          <EmptyDescription className="text-xs text-gray-400">
            Nhấn "Tạo role mới" để bắt đầu
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              roles={roles}
              onView={() => setViewId(role.id)}
              onEdit={() => {
                setViewId(null)
                adminService.getRole(role.id).then(setEditTarget)
              }}
              onDelete={() => setDeleteTarget(role)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <RoleFormModal
        open={showCreate}
        roles={roles}
        suggestedResources={suggestedResources}
        onClose={() => setShowCreate(false)}
      />
      <RoleFormModal
        open={!!editTarget}
        initial={editTarget ?? undefined}
        roles={roles}
        suggestedResources={suggestedResources}
        onClose={() => setEditTarget(null)}
      />
      <RoleDetailPanel
        open={!!viewId}
        roleId={viewId}
        roles={roles}
        onEdit={(detail) => { setViewId(null); setEditTarget(detail) }}
        onClose={() => setViewId(null)}
      />
      <DeleteConfirm
        open={!!deleteTarget}
        role={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
