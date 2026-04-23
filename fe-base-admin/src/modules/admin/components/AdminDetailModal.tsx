import { useState } from 'react'
import { ShieldOff, Monitor, Globe, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Badge } from '@shared/components/ui/badge'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@shared/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/components/ui/tabs'
import { Skeleton } from '@shared/components/ui/skeleton'
import { cn } from '@shared/utils'
import { useAdminSessions, useAdminAuthLogs, useRevokeSession } from '../hooks/useAdminSessions'
import type { Admin, AdminSession, AuthLogEntry, AuthEventType } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  return `${Math.floor(hrs / 24)} ngày trước`
}

const EVENT_META: Record<AuthEventType, { label: string; icon: React.ElementType; cls: string }> = {
  LOGIN:   { label: 'Đang hoạt động', icon: CheckCircle,    cls: 'text-green-600 bg-green-50' },
  LOGOUT:  { label: 'Đã đăng xuất',   icon: XCircle,        cls: 'text-gray-500 bg-gray-100' },
  EXPIRED: { label: 'Hết hạn',        icon: AlertTriangle,  cls: 'text-amber-600 bg-amber-50' },
}

// ── Session row ───────────────────────────────────────────────────────────────

function SessionRow({ session, adminId }: { session: AdminSession; adminId: string }) {
  const revoke = useRevokeSession(adminId)
  const [confirming, setConfirming] = useState(false)

  const isValid = session.isActive && !session.isExpired

  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50">
        <Monitor className="h-4 w-4 text-gray-400" />
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{session.deviceName}</span>
          <Badge
            className={cn(
              'text-[10px] font-medium border-0 shrink-0',
              isValid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
            )}
          >
            {isValid ? 'Active' : session.isExpired ? 'Expired' : 'Revoked'}
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Globe className="h-3 w-3 shrink-0" />
          <span>{session.ipAddress}</span>
          <span className="mx-1">·</span>
          <Clock className="h-3 w-3 shrink-0" />
          <span>Active {fmtRelative(session.lastActiveAt)}</span>
        </div>

        <p className="text-xs text-gray-400 truncate">{session.userAgent}</p>
      </div>

      {isValid && (
        <div className="shrink-0">
          {confirming ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => revoke.mutate(session.id, { onSuccess: () => setConfirming(false) })}
                disabled={revoke.isPending}
                className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {revoke.isPending ? '...' : 'Thu hồi'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Huỷ
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600"
            >
              <ShieldOff className="h-3.5 w-3.5" />
              Thu hồi
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Auth log row ──────────────────────────────────────────────────────────────

function AuthLogRow({ log }: { log: AuthLogEntry }) {
  const meta = EVENT_META[log.event]
  const Icon = meta.icon

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', meta.cls)}>
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{meta.label}</span>
          <span className="text-xs text-gray-400">{fmtRelative(log.loginAt)}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
          <span className="truncate">{log.deviceName}</span>
          <span>·</span>
          <span>{log.ipAddress}</span>
        </div>
        <p className="text-xs text-gray-300 mt-0.5">{fmtDate(log.loginAt)}</p>
      </div>
    </div>
  )
}

// ── Sessions tab ──────────────────────────────────────────────────────────────

function SessionsTab({ admin }: { admin: Admin }) {
  const [onlyActive, setOnlyActive] = useState<boolean | undefined>(undefined)
  const { data, isLoading } = useAdminSessions(admin.id, onlyActive)
  const sessions = data?.data ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {(['all', 'active', 'inactive'] as const).map((f) => {
          const val = f === 'all' ? undefined : f === 'active' ? true : false
          const active = onlyActive === val
          return (
            <button
              key={f}
              onClick={() => setOnlyActive(val)}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? 'bg-zinc-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              )}
            >
              {f === 'all' ? 'Tất cả' : f === 'active' ? 'Đang hoạt động' : 'Đã thu hồi'}
            </button>
          )
        })}
        <span className="ml-auto text-xs text-gray-400">{data?.meta.totalItems ?? 0} sessions</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Không có session nào</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <SessionRow key={s.id} session={s} adminId={admin.id} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Auth logs tab ─────────────────────────────────────────────────────────────

function AuthLogsTab({ admin }: { admin: Admin }) {
  const { data, isLoading } = useAdminAuthLogs(admin.id)
  const logs = data?.data ?? []

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">{data?.meta.totalItems ?? 0} sự kiện</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 4].map((i) => (
            <Skeleton key={i} className="h-12 rounded" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Chưa có lịch sử đăng nhập</p>
      ) : (
        <div>
          {logs.map((log) => (
            <AuthLogRow key={`${log.sessionId}-${log.loginAt}`} log={log} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

interface Props {
  admin: Admin | null
  open: boolean
  onClose: () => void
}

export function AdminDetailModal({ admin, open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl gap-0 p-0 rounded-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {admin && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 pr-12 shrink-0">
              <div>
                <DialogTitle className="text-base font-semibold text-gray-900">
                  {admin.email}
                </DialogTitle>
                <DialogDescription asChild>
                  <p className="text-xs text-gray-400">
                    <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">
                      {admin.id.slice(0, 12)}…
                    </span>
                    <span className="ml-2">{admin.role}</span>
                  </p>
                </DialogDescription>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="sessions" className="flex flex-col min-h-0 flex-1">
              <TabsList className="h-auto shrink-0 gap-0 rounded-none bg-transparent p-0 border-b border-gray-100 justify-start px-6">
                <TabsTrigger
                  value="sessions"
                  className="relative rounded-none border-0 bg-transparent px-0 pr-6 py-3 text-sm font-medium shadow-none data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=inactive]:text-gray-400 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:after:bg-zinc-900"
                >
                  Sessions
                </TabsTrigger>
                <TabsTrigger
                  value="auth-logs"
                  className="relative rounded-none border-0 bg-transparent px-0 pr-6 py-3 text-sm font-medium shadow-none data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=inactive]:text-gray-400 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:after:bg-zinc-900"
                >
                  Auth Logs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sessions" className="overflow-y-auto p-6 mt-0">
                <SessionsTab admin={admin} />
              </TabsContent>
              <TabsContent value="auth-logs" className="overflow-y-auto p-6 mt-0">
                <AuthLogsTab admin={admin} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
