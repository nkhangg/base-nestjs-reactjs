import { useState } from 'react'
import { Shield, X, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { useRoles } from '../hooks/useRoles'
import { useAdminRoles, useSyncAdminRoles } from '../hooks/useAdmins'
import type { Admin } from '../types'

interface Props {
  admin: Admin | null
  open: boolean
  onClose: () => void
}

export function AdminRolesModal({ admin, open, onClose }: Props) {
  const [adding, setAdding] = useState<string>('')

  const { data: rolesData, isLoading: loadingRoles } = useRoles('admin')
  const { data: currentRoles = [], isLoading: loadingCurrent } = useAdminRoles(
    admin?.id ?? '',
  )
  const syncRoles = useSyncAdminRoles(admin?.id ?? '')

  const availableRoles = (rolesData?.data ?? []).filter(
    (r) => !currentRoles.includes(r.name),
  )

  const handleAdd = () => {
    if (!adding) return
    const next = [...currentRoles, adding]
    syncRoles.mutate(next, {
      onSuccess: () => {
        setAdding('')
        toast.success(`Đã thêm role "${adding}"`)
      },
      onError: () => toast.error('Thêm role thất bại'),
    })
  }

  const handleRemove = (role: string) => {
    const next = currentRoles.filter((r) => r !== role)
    syncRoles.mutate(next, {
      onSuccess: () => toast.success(`Đã xóa role "${role}"`),
      onError: () => toast.error('Xóa role thất bại'),
    })
  }

  const isLoading = loadingRoles || loadingCurrent

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0 rounded-2xl">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 pr-12">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Quản lý roles
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 truncate max-w-[240px]">
              {admin?.email}
            </DialogDescription>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Current roles */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Roles hiện tại
            </p>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang tải...
              </div>
            ) : currentRoles.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Chưa có role nào</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white"
                  >
                    {role}
                    <button
                      onClick={() => handleRemove(role)}
                      disabled={syncRoles.isPending}
                      className="ml-0.5 rounded-sm opacity-70 hover:opacity-100 disabled:opacity-30 transition-opacity"
                      title={`Xóa role ${role}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Add role */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Thêm role
            </p>
            <div className="flex gap-2">
              <Select value={adding} onValueChange={setAdding} disabled={isLoading}>
                <SelectTrigger className="flex-1 h-9 text-sm">
                  <SelectValue placeholder="Chọn role để thêm..." />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-400">
                      Không có role khả dụng
                    </div>
                  ) : (
                    availableRoles.map((r) => (
                      <SelectItem key={r.id} value={r.name}>
                        <div>
                          <span className="font-medium">{r.name}</span>
                          {r.description && (
                            <span className="ml-2 text-xs text-gray-400">
                              {r.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!adding || syncRoles.isPending}
                isLoading={syncRoles.isPending}
                className="gap-1.5 px-3"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm
              </Button>
            </div>
          </div>

          {/* Available role badges (info) */}
          {availableRoles.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">Có thể thêm:</p>
              <div className="flex flex-wrap gap-1.5">
                {availableRoles.map((r) => (
                  <Badge
                    key={r.id}
                    variant="outline"
                    className="cursor-pointer text-xs hover:bg-gray-100 transition-colors"
                    onClick={() => setAdding(r.name)}
                  >
                    {r.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-4">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
