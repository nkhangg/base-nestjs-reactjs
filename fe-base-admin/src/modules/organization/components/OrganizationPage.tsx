import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Trash2 } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Skeleton } from '@shared/components/ui/skeleton'
import { ConfirmDialog } from '@shared/components/ui/confirm-dialog'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@shared/components/ui/empty'
import { formatDate } from '@shared/utils'
import { DATE_FORMAT } from '@shared/constants'
import { useOrgList, useDeleteOrg } from '../hooks/useOrganization'
import { OrganizationDetailDrawer } from './OrganizationDetailDrawer'
import type { Organization } from '../types'
import { useDebounce } from '@shared/hooks'

export function OrganizationPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null)

  const debouncedSearch = useDebounce(search, 300)
  const { data, isLoading } = useOrgList({ page, limit: 20, search: debouncedSearch || undefined })
  const deleteOrg = useDeleteOrg()

  const handleRowClick = (org: Organization) => {
    setSelectedOrg(org)
    setDrawerOpen(true)
  }

  const handleDeleteClick = (e: React.MouseEvent, org: Organization) => {
    e.stopPropagation()
    setDeletingOrg(org)
  }

  const confirmDelete = () => {
    if (!deletingOrg) return
    deleteOrg.mutate(deletingOrg.id, {
      onSettled: () => setDeletingOrg(null),
    })
  }

  const total = data?.total ?? 0
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{t('organization.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('organization.subtitle')}
        </p>
      </div>

      {/* Search */}
      <div className="mb-4 max-w-sm">
        <Input
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <Empty>
          <EmptyMedia><Building2 className="size-8 text-muted-foreground" /></EmptyMedia>
          <EmptyTitle>{t('organization.empty')}</EmptyTitle>
          <EmptyDescription>{t('organization.emptyDesc')}</EmptyDescription>
        </Empty>
      ) : (
        <>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{t('organization.name')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('organization.ownerId')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('organization.createdAt')}</th>
                  <th className="px-4 py-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((org) => (
                  <tr
                    key={org.id}
                    onClick={() => handleRowClick(org)}
                    className="border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{org.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {org.ownerId.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(org.createdAt, DATE_FORMAT.DISPLAY)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => handleDeleteClick(e, org)}
                        title={t('common.delete')}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{total} {t('organization.total')}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ←
                </Button>
                <span className="px-2 py-1">{page} / {totalPages}</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  →
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <OrganizationDetailDrawer
        org={selectedOrg}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <ConfirmDialog
        open={!!deletingOrg}
        onClose={() => setDeletingOrg(null)}
        onConfirm={confirmDelete}
        title={t('organization.deleteOrg')}
        description={t('organization.deleteOrgConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
      />
    </div>
  )
}
