import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  UserPlus,
  ShieldOff,
  ShieldCheck,
  Users,
  ShieldX,
  AlertTriangle,
  Eye,
  MoreHorizontal,
  Shield,
  Pencil,
  Camera,
  KeyRound,
  EyeOff,
} from 'lucide-react'
import { Badge } from '@shared/components/ui/badge'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { DataTable, useDataTable, type ColumnDef } from '@shared/components/ui/data-table'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/components/ui/tabs'
import { ConfirmDialog } from '@shared/components/ui/confirm-dialog'
import { FieldLabel, FieldError } from '@shared/components/ui/field'
import { cn } from '@shared/utils'
import { useAdmins, useCreateAdmin, useDeactivateAdmin, useActivateAdmin, useUpdateAdminInfo, useResetAdminPassword } from '../hooks/useAdmins'
import { mediaService } from '@modules/media'
import type { FolderNode } from '@modules/media'
import { toast } from 'sonner'
import { AdminDetailModal } from './AdminDetailModal'
import { AdminRolesModal } from './AdminRolesModal'
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
              Tài khoản có hiệu lực ngay sau khi tạo. Roles có thể gán sau.
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

// ─── Edit admin modal ─────────────────────────────────────────────────────────

const infoSchema = z.object({
  name: z.string().max(100, 'Tối đa 100 ký tự').optional().or(z.literal('')),
  phone: z.string().max(20, 'Tối đa 20 ký tự').optional().or(z.literal('')),
})
type InfoValues = z.infer<typeof infoSchema>

const pwdSchema = z
  .object({
    newPassword: z.string().min(8, 'Tối thiểu 8 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
type PwdValues = z.infer<typeof pwdSchema>

async function getOrCreateAdminAvatarFolderId(): Promise<string> {
  const folders = await mediaService.listFolders()
  const find = (nodes: FolderNode[], name: string): FolderNode | undefined =>
    nodes.find((n) => n.name.toLowerCase() === name.toLowerCase())

  let adminFolder = find(folders, 'admin')
  if (!adminFolder) {
    const { folderId } = await mediaService.createFolder({ name: 'admin' })
    const refreshed = await mediaService.listFolders()
    adminFolder = refreshed.find((n) => n.id === folderId)!
  }
  const avatarFolder = find(adminFolder.children ?? [], 'avatar')
  if (!avatarFolder) {
    const { folderId } = await mediaService.createFolder({ name: 'avatar', parentId: adminFolder.id })
    return folderId
  }
  return avatarFolder.id
}

function PasswordToggleInput({
  placeholder,
  error,
  registration,
}: {
  placeholder?: string
  error?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete="new-password"
          aria-invalid={!!error}
          className="pr-10"
          {...registration}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function EditAdminModal({
  admin,
  open,
  onClose,
  onAdminUpdate,
}: {
  admin: Admin | null
  open: boolean
  onClose: () => void
  onAdminUpdate: (updated: Admin) => void
}) {
  const updateInfo = useUpdateAdminInfo()
  const resetPassword = useResetAdminPassword()
  const [uploading, setUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const infoForm = useForm<InfoValues>({
    resolver: zodResolver(infoSchema),
    values: { name: admin?.name ?? '', phone: admin?.phone ?? '' },
  })
  const pwdForm = useForm<PwdValues>({ resolver: zodResolver(pwdSchema) })

  const handleClose = () => {
    infoForm.reset()
    pwdForm.reset()
    onClose()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !admin) return
    setUploading(true)
    try {
      const folderId = await getOrCreateAdminAvatarFolderId()
      const [uploaded] = await mediaService.uploadFiles([file], { scope: 'public', folderId })
      await updateInfo.mutateAsync({ id: admin.id, dto: { avatarUrl: uploaded.url } })
      onAdminUpdate({ ...admin, avatarUrl: uploaded.url })
      toast.success('Cập nhật ảnh đại diện thành công')
    } catch {
      toast.error('Tải ảnh lên thất bại')
    } finally {
      setUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const onSubmitInfo = async (values: InfoValues) => {
    if (!admin) return
    try {
      const name = values.name?.trim() || null
      const phone = values.phone?.trim() || null
      await updateInfo.mutateAsync({ id: admin.id, dto: { name, phone } })
      onAdminUpdate({ ...admin, name, phone })
      toast.success('Cập nhật thông tin thành công')
    } catch {
      toast.error('Cập nhật thất bại')
    }
  }

  const onSubmitPwd = async (values: PwdValues) => {
    if (!admin) return
    try {
      await resetPassword.mutateAsync({ id: admin.id, dto: { newPassword: values.newPassword } })
      toast.success('Đặt lại mật khẩu thành công')
      pwdForm.reset()
    } catch {
      toast.error('Đặt lại mật khẩu thất bại')
    }
  }

  const initials = (admin?.name || admin?.email || '?').charAt(0).toUpperCase()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg gap-0 p-0 rounded-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 pr-12">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900">
            <Pencil className="h-4 w-4 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-gray-900">Chỉnh sửa admin</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">{admin?.email}</DialogDescription>
          </div>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <div className="border-b border-gray-100 px-6 pt-3">
            <TabsList className="h-auto gap-0 bg-transparent p-0">
              <TabsTrigger
                value="info"
                className="rounded-none border-b-2 border-transparent px-3 pb-2 pt-0 text-sm font-medium text-gray-500 data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none"
              >
                Thông tin
              </TabsTrigger>
              <TabsTrigger
                value="avatar"
                className="rounded-none border-b-2 border-transparent px-3 pb-2 pt-0 text-sm font-medium text-gray-500 data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none"
              >
                Ảnh đại diện
              </TabsTrigger>
              <TabsTrigger
                value="password"
                className="rounded-none border-b-2 border-transparent px-3 pb-2 pt-0 text-sm font-medium text-gray-500 data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none"
              >
                Mật khẩu
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab: Thông tin */}
          <TabsContent value="info" className="mt-0">
            <form onSubmit={infoForm.handleSubmit(onSubmitInfo)} className="space-y-4 px-6 py-5">
              <FormField label="Tên hiển thị" error={infoForm.formState.errors.name?.message}>
                <Input placeholder="Nhập tên..." {...infoForm.register('name')} />
              </FormField>
              <FormField label="Số điện thoại" error={infoForm.formState.errors.phone?.message}>
                <Input placeholder="Nhập SĐT..." {...infoForm.register('phone')} />
              </FormField>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={handleClose} disabled={updateInfo.isPending}>
                  Huỷ
                </Button>
                <Button type="submit" className="flex-1" isLoading={updateInfo.isPending}>
                  {updateInfo.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Tab: Ảnh đại diện */}
          <TabsContent value="avatar" className="mt-0">
            <div className="flex flex-col items-center gap-5 px-6 py-8">
              <div className="relative">
                {admin?.avatarUrl ? (
                  <img
                    src={admin.avatarUrl}
                    alt={admin.name ?? admin.email}
                    className="h-24 w-24 rounded-full object-cover ring-2 ring-gray-200"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-900 text-3xl font-semibold text-white ring-2 ring-gray-200">
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-900 text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">{admin?.name ?? '—'}</p>
                <p className="text-xs text-gray-400">{admin?.email}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={() => avatarInputRef.current?.click()}
                isLoading={uploading}
                disabled={uploading}
              >
                <Camera className="h-4 w-4" />
                {uploading ? 'Đang tải lên...' : 'Đổi ảnh đại diện'}
              </Button>
              <p className="text-xs text-gray-400">JPG, PNG — tối đa 10MB</p>
            </div>
          </TabsContent>

          {/* Tab: Mật khẩu */}
          <TabsContent value="password" className="mt-0">
            <form onSubmit={pwdForm.handleSubmit(onSubmitPwd)} className="space-y-4 px-6 py-5">
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-700">
                  Đặt lại mật khẩu mới cho tài khoản này. Không cần nhập mật khẩu cũ.
                </p>
              </div>
              <FormField label="Mật khẩu mới">
                <PasswordToggleInput
                  placeholder="Tối thiểu 8 ký tự"
                  error={pwdForm.formState.errors.newPassword?.message}
                  registration={pwdForm.register('newPassword')}
                />
              </FormField>
              <FormField label="Xác nhận mật khẩu">
                <PasswordToggleInput
                  placeholder="Nhập lại mật khẩu mới"
                  error={pwdForm.formState.errors.confirmPassword?.message}
                  registration={pwdForm.register('confirmPassword')}
                />
              </FormField>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => pwdForm.reset()} disabled={resetPassword.isPending}>
                  Huỷ
                </Button>
                <Button type="submit" className="flex-1" isLoading={resetPassword.isPending}>
                  {resetPassword.isPending ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ─── Roles cell ───────────────────────────────────────────────────────────────

function RolesCell({
  admin,
  onManage,
}: {
  admin: Admin
  onManage: (admin: Admin) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {admin.roles.length === 0 ? (
        <span className="text-xs text-gray-400 italic">Chưa có role</span>
      ) : (
        admin.roles.map((role) => (
          <span
            key={role}
            className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
          >
            {role}
          </span>
        ))
      )}
      {admin.isActive && (
        <button
          onClick={() => onManage(admin)}
          className="rounded p-0.5 text-gray-300 transition-colors hover:text-gray-600"
          title="Quản lý roles"
        >
          <Shield className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

// ─── Action dropdown ──────────────────────────────────────────────────────────

function ActionDropdown({
  admin,
  onView,
  onEdit,
  onManageRoles,
}: {
  admin: Admin
  onView: () => void
  onEdit: () => void
  onManageRoles: () => void
}) {
  const [confirming, setConfirming] = useState<'deactivate' | 'activate' | null>(null)
  const deactivate = useDeactivateAdmin()
  const activate = useActivateAdmin()

  const handleConfirm = () => {
    if (confirming === 'deactivate') {
      deactivate.mutate(admin.id, {
        onSuccess: () => { setConfirming(null); toast.success('Đã vô hiệu hóa tài khoản') },
        onError: () => { setConfirming(null); toast.error('Vô hiệu hóa thất bại') },
      })
    } else if (confirming === 'activate') {
      activate.mutate(admin.id, {
        onSuccess: () => { setConfirming(null); toast.success('Đã kích hoạt tài khoản') },
        onError: () => { setConfirming(null); toast.error('Kích hoạt thất bại') },
      })
    }
  }

  return (
    <>
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
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onView} className="gap-2">
              <Eye className="h-3.5 w-3.5" />
              Chi tiết
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit} className="gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Chỉnh sửa
            </DropdownMenuItem>
            {admin.isActive && (
              <DropdownMenuItem onClick={onManageRoles} className="gap-2">
                <Shield className="h-3.5 w-3.5" />
                Quản lý roles
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {admin.isActive ? (
              <DropdownMenuItem
                onClick={() => setConfirming('deactivate')}
                className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-600"
              >
                <ShieldOff className="h-3.5 w-3.5" />
                Vô hiệu hoá
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => setConfirming('activate')}
                className="gap-2 text-green-600 focus:bg-green-50 focus:text-green-600"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Kích hoạt lại
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirming === 'deactivate'}
        onClose={() => setConfirming(null)}
        onConfirm={handleConfirm}
        variant="danger"
        title="Vô hiệu hoá tài khoản?"
        description={<>Tài khoản <strong>{admin.email}</strong> sẽ bị khoá và không thể đăng nhập. Có thể kích hoạt lại sau.</>}
        confirmLabel="Vô hiệu hoá"
        loading={deactivate.isPending}
      />

      <ConfirmDialog
        open={confirming === 'activate'}
        onClose={() => setConfirming(null)}
        onConfirm={handleConfirm}
        variant="success"
        title="Kích hoạt tài khoản?"
        description={<>Tài khoản <strong>{admin.email}</strong> sẽ được mở lại và có thể đăng nhập bình thường.</>}
        confirmLabel="Kích hoạt"
        loading={activate.isPending}
      />
    </>
  )
}

// ─── Column definitions ───────────────────────────────────────────────────────

function buildColumns(
  onView: (admin: Admin) => void,
  onEdit: (admin: Admin) => void,
  onManageRoles: (admin: Admin) => void,
): ColumnDef<AdminRow>[] {
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
      key: 'roles',
      header: 'Roles',
      width: '200px',
      render: (_, row) => (
        <RolesCell
          admin={row as unknown as Admin}
          onManage={onManageRoles}
        />
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Hoạt động', value: 'true' },
        { label: 'Không hoạt động', value: 'false' },
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
      hideable: false,
      width: '56px',
      render: (_, row) => (
        <ActionDropdown
          admin={row as unknown as Admin}
          onView={() => onView(row as unknown as Admin)}
          onEdit={() => onEdit(row as unknown as Admin)}
          onManageRoles={() => onManageRoles(row as unknown as Admin)}
        />
      ),
    },
  ]
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminPage() {
  const table = useDataTable<AdminRow>({
    tableId: 'admin-list',
    showSearch: true,
    searchPlaceholder: 'Tìm theo email...',
    showFilters: true,
    showColumnVisibility: true,
    showRefreshButton: true,
    persistPageSize: true,
    persistFilters: true,
    persistSort: true,
    syncToUrl: true,
  })

  const { data, isLoading, isError, refetch } = useAdmins(
    table.buildQueryParams(['email']),
  )

  const [showModal, setShowModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null)
  const [rolesAdmin, setRolesAdmin] = useState<Admin | null>(null)

  const admins = data?.data ?? []
  const meta = data?.meta
  const columns = buildColumns(setSelectedAdmin, setEditAdmin, setRolesAdmin)

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

      {/* ── DataTable ── */}
      {!isError && (
        <DataTable<AdminRow>
          columns={columns}
          data={admins as AdminRow[]}
          loading={isLoading}
          rowKey="id"
          emptyText="Chưa có admin nào"
          table={table}
          total={meta?.totalItems}
          onRefresh={refetch}
        />
      )}

      <CreateAdminModal open={showModal} onClose={() => setShowModal(false)} />

      <EditAdminModal
        admin={editAdmin}
        open={!!editAdmin}
        onClose={() => setEditAdmin(null)}
        onAdminUpdate={(updated) => setEditAdmin(updated)}
      />

      <AdminDetailModal
        admin={selectedAdmin}
        open={!!selectedAdmin}
        onClose={() => setSelectedAdmin(null)}
      />

      <AdminRolesModal
        admin={rolesAdmin}
        open={!!rolesAdmin}
        onClose={() => setRolesAdmin(null)}
      />
    </div>
  )
}
