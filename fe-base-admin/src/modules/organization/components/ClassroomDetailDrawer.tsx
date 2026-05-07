import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Copy, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@shared/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { Skeleton } from '@shared/components/ui/skeleton'
import { ConfirmDialog } from '@shared/components/ui/confirm-dialog'
import { formatDate } from '@shared/utils'
import { DATE_FORMAT } from '@shared/constants'
import { useMemberList, useRemoveMember, useClassroomReport } from '../hooks/useOrganization'
import type { Classroom } from '../types'

interface Props {
  classroom: Classroom | null
  open: boolean
  onClose: () => void
}

export function ClassroomDetailDrawer({ classroom, open, onClose }: Props) {
  const { t } = useTranslation()
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)

  const { data: memberData, isLoading: membersLoading } = useMemberList(
    open ? classroom?.id : undefined,
  )
  const { data: reportData, isLoading: reportLoading } = useClassroomReport(
    open ? classroom?.id : undefined,
  )
  const removeMember = useRemoveMember(classroom?.id ?? '')

  const handleCopyInviteCode = async () => {
    if (!classroom?.inviteCode) return
    await navigator.clipboard.writeText(classroom.inviteCode)
    toast.success(t('organization.inviteCodeCopied'))
  }

  const handleRemoveMember = (userId: string) => {
    setRemovingUserId(userId)
  }

  const confirmRemove = () => {
    if (!removingUserId) return
    removeMember.mutate(removingUserId, {
      onSettled: () => setRemovingUserId(null),
    })
  }

  if (!classroom) return null

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetTitle>{classroom.name}</SheetTitle>
          <SheetDescription className="sr-only">Classroom detail</SheetDescription>

          {/* Invite code */}
          <div className="mt-4 flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
            <span className="text-xs text-muted-foreground">{t('organization.inviteCode')}:</span>
            <code className="font-mono text-sm font-semibold tracking-widest">
              {classroom.inviteCode}
            </code>
            <Button
              size="icon"
              variant="ghost"
              className="ml-auto h-7 w-7"
              onClick={handleCopyInviteCode}
              title={t('organization.copyInviteCode')}
            >
              <Copy className="size-4" />
            </Button>
          </div>

          <Tabs defaultValue="members" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="members" className="flex-1">
                {t('organization.members')}
              </TabsTrigger>
              <TabsTrigger value="report" className="flex-1">
                {t('organization.report')}
              </TabsTrigger>
            </TabsList>

            {/* Members tab */}
            <TabsContent value="members">
              {membersLoading ? (
                <div className="space-y-2 mt-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : memberData?.data.length === 0 ? (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {t('common.noData')}
                </p>
              ) : (
                <div className="mt-3 space-y-1">
                  {memberData?.data.map((m) => (
                    <div
                      key={m.userId}
                      className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{m.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('organization.joinedAt')}: {formatDate(m.joinedAt, DATE_FORMAT.DISPLAY)}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveMember(m.userId)}
                        title={t('organization.removeMember')}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Report tab */}
            <TabsContent value="report">
              {reportLoading ? (
                <div className="space-y-2 mt-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : reportData?.data.length === 0 ? (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {t('common.noData')}
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-4">{t('organization.memberName')}</th>
                        <th className="pb-2 pr-4">{t('progress.xpTotal')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData?.data.map((m) => (
                        <tr key={m.userId} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium">{m.userName}</td>
                          <td className="py-2 pr-4">
                            <Badge variant="secondary">{m.xpTotal} XP</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!removingUserId}
        onClose={() => setRemovingUserId(null)}
        onConfirm={confirmRemove}
        title={t('organization.removeMember')}
        description={t('organization.removeMemberConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
      />
    </>
  )
}
