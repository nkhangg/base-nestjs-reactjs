import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Camera, Monitor, Globe, Shield, ShieldOff } from 'lucide-react'
import { cn } from '@shared/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/components/ui/tabs'
import { useChangePassword, useCurrentUser } from '@modules/auth'
import { mediaService } from '@modules/media'
import { useProfile, useUpdateProfile, useSessions, useRevokeSession } from '../hooks/useProfile'
import { profileService } from '../services/profile.service'
import { toast } from 'sonner'

// ── Schemas ───────────────────────────────────────────────────────────────────
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

const profileSchema = z.object({
  name: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
})

type PasswordFormValues = z.infer<typeof passwordSchema>
type ProfileFormValues = z.infer<typeof profileSchema>

// ── PasswordField ─────────────────────────────────────────────────────────────
function PasswordField({
  id,
  label,
  error,
  registration,
}: {
  id: string
  label: string
  error?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete="off"
          className={cn(
            'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-900',
            'placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-400',
          )}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Avatar Section ────────────────────────────────────────────────────────────
function AvatarSection({
  profile,
  profileLoading,
  initial,
}: {
  profile: ReturnType<typeof useProfile>['data']
  profileLoading: boolean
  initial: string
}) {
  const { mutateAsync: updateProfile } = useUpdateProfile()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const folderId = await profileService.getOrCreateAvatarFolderId()
      const [uploaded] = await mediaService.uploadFiles([file], { scope: 'public', folderId })
      await updateProfile({ avatarUrl: uploaded.url })
    } catch {
      toast.error('Tải ảnh lên thất bại')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {profile?.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt="avatar"
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 text-2xl font-semibold text-white">
            {profileLoading ? '…' : initial}
          </div>
        )}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          title="Đổi ảnh đại diện"
        >
          <Camera className="size-3.5" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>
      {uploading && <p className="text-xs text-gray-400">Đang tải ảnh...</p>}
    </div>
  )
}

// ── Tab: Thông tin ────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user } = useCurrentUser()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { mutateAsync: updateProfile, isPending: updatingProfile } = useUpdateProfile()

  const initial = (profile?.name || profile?.email || user?.email || 'A')[0].toUpperCase()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: profile?.name ?? '',
      phone: profile?.phone ?? '',
    },
  })

  const handleSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile({
        name: values.name || null,
        phone: values.phone || null,
      })
    } catch {
      // error handled by mutation onError (toast)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left: Account summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Thông tin cơ bản</h2>

        <AvatarSection profile={profile} profileLoading={profileLoading} initial={initial} />

        <div className="mt-4 space-y-2 text-sm">
          <div>
            <p className="text-xs text-gray-400">Email</p>
            <p className="truncate font-medium text-gray-900">{profile?.email ?? user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Vai trò</p>
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
              {profile?.role ?? (user?.isAdmin ? 'admin' : 'user')}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400">Trạng thái</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Đang hoạt động
            </span>
          </div>
          {profile?.createdAt && (
            <div>
              <p className="text-xs text-gray-400">Thành viên từ</p>
              <p className="text-gray-700">
                {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Edit form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Chỉnh sửa thông tin</h2>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="name">
                Tên hiển thị
              </label>
              <input
                id="name"
                type="text"
                placeholder="Nguyễn Văn A"
                className={cn(
                  'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900',
                  'placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400',
                  form.formState.errors.name && 'border-red-400',
                )}
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="phone">
                Số điện thoại
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="0901 234 567"
                className={cn(
                  'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900',
                  'placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400',
                  form.formState.errors.phone && 'border-red-400',
                )}
                {...form.register('phone')}
              />
              {form.formState.errors.phone && (
                <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updatingProfile}
              className="h-10 rounded-lg bg-zinc-900 px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updatingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Tab: Bảo mật ──────────────────────────────────────────────────────────────
function SecurityTab() {
  const { mutateAsync: changePassword, isPending: changingPassword } = useChangePassword()

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  })

  const handleSubmit = async (values: PasswordFormValues) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      form.reset()
    } catch {
      // error handled by mutation onError (toast)
    }
  }

  return (
    <div className="max-w-md">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Đổi mật khẩu</h2>
        <p className="mb-4 text-xs text-gray-500">
          Mật khẩu mới phải có ít nhất 6 ký tự
        </p>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
          <PasswordField
            id="currentPassword"
            label="Mật khẩu hiện tại"
            error={form.formState.errors.currentPassword?.message}
            registration={form.register('currentPassword')}
          />
          <PasswordField
            id="newPassword"
            label="Mật khẩu mới"
            error={form.formState.errors.newPassword?.message}
            registration={form.register('newPassword')}
          />
          <PasswordField
            id="confirmPassword"
            label="Xác nhận mật khẩu mới"
            error={form.formState.errors.confirmPassword?.message}
            registration={form.register('confirmPassword')}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="h-10 rounded-lg bg-zinc-900 px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changingPassword ? 'Đang lưu...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Tab: Phiên đăng nhập ──────────────────────────────────────────────────────
function SessionsTab() {
  const { user } = useCurrentUser()
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions()
  const { mutateAsync: revokeSession, isPending: revoking } = useRevokeSession()
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const handleRevoke = async (sessionId: string) => {
    if (confirmingId !== sessionId) {
      setConfirmingId(sessionId)
      return
    }
    setRevokingId(sessionId)
    try {
      await revokeSession(sessionId)
    } finally {
      setRevokingId(null)
      setConfirmingId(null)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Phiên đăng nhập đang hoạt động</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Quản lý các thiết bị đang đăng nhập vào tài khoản
          </p>
        </div>
        {sessions.length > 0 && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {sessions.length}
          </span>
        )}
      </div>

      {sessionsLoading ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400">Đang tải...</div>
      ) : sessions.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400">Không có phiên nào</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {sessions.map((session) => {
            const isCurrent = session.id === user?.sessionId
            const isConfirming = confirmingId === session.id
            const isRevoking = revokingId === session.id

            return (
              <div
                key={session.id}
                className={cn(
                  'flex items-center justify-between gap-4 px-6 py-4',
                  isCurrent && 'bg-blue-50/50',
                )}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 shrink-0 text-gray-400">
                    <Monitor className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {session.deviceName}
                      </p>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          <Shield className="size-3" />
                          Hiện tại
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Globe className="size-3" />
                        {session.ipAddress || 'Không rõ'}
                      </span>
                      <span>
                        Đăng nhập {new Date(session.createdAt).toLocaleString('vi-VN')}
                      </span>
                      <span>
                        Hoạt động {new Date(session.lastActiveAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isCurrent ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : isConfirming ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Thu hồi?</span>
                      <button
                        onClick={() => void handleRevoke(session.id)}
                        disabled={isRevoking || revoking}
                        className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        {isRevoking ? '...' : 'Xác nhận'}
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => void handleRevoke(session.id)}
                      className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <ShieldOff className="size-3" />
                      Thu hồi
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ProfilePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Hồ sơ của tôi</h1>
        <p className="mt-0.5 text-sm text-gray-500">Quản lý thông tin tài khoản và bảo mật</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6 bg-gray-100">
          <TabsTrigger value="profile">Thông tin</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
          <TabsTrigger value="sessions">Phiên đăng nhập</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
