import { Link } from 'react-router-dom'
import { Activity, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card'
import { ROUTES } from '@config/routes'
import { useCurrentUser } from '@modules/auth'

const stats = [
  { label: 'Tổng admins', value: '—', icon: Users, desc: 'Tài khoản quản trị' },
  { label: 'Sessions', value: '—', icon: Activity, desc: 'Đang hoạt động' },
  { label: 'Đăng nhập hôm nay', value: '—', icon: ShieldCheck, desc: 'Trong 24h qua' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Chào buổi sáng'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export function DashboardPage() {
  const { user } = useCurrentUser()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {getGreeting()}, {user?.email?.split('@')[0]} 👋
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Link
          to={ROUTES.ADMIN}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <UserPlus className="size-4" />
          Tạo admin
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, desc }) => (
          <Card key={label} className="border-gray-200 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                  <p className="mt-1 text-xs text-gray-400">{desc}</p>
                </div>
                <div className="rounded-lg bg-gray-100 p-2">
                  <Icon className="size-4 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info row */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* System status */}
        <Card className="border-gray-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Trạng thái hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'API Server' },
              { label: 'Database' },
              { label: 'Auth Service' },
            ].map(({ label }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Hoạt động
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="border-gray-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              to={ROUTES.ADMIN}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <UserPlus className="size-4 text-gray-400" />
              Tạo tài khoản admin mới
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
