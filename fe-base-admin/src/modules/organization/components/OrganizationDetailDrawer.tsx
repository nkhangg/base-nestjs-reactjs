import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@shared/components/ui/sheet'
import { Skeleton } from '@shared/components/ui/skeleton'
import { formatDate } from '@shared/utils'
import { DATE_FORMAT } from '@shared/constants'
import { useClassroomList } from '../hooks/useOrganization'
import { ClassroomDetailDrawer } from './ClassroomDetailDrawer'
import type { Classroom, Organization } from '../types'

interface Props {
  org: Organization | null
  open: boolean
  onClose: () => void
}

export function OrganizationDetailDrawer({ org, open, onClose }: Props) {
  const { t } = useTranslation()
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null)
  const [classroomDrawerOpen, setClassroomDrawerOpen] = useState(false)

  const { data: classroomData, isLoading } = useClassroomList(open ? org?.id : undefined)

  const handleOpenClassroom = (classroom: Classroom) => {
    setSelectedClassroom(classroom)
    setClassroomDrawerOpen(true)
  }

  if (!org) return null

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetTitle>{org.name}</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground mt-1">
            {t('organization.createdAt')}: {formatDate(org.createdAt, DATE_FORMAT.DISPLAY)}
          </SheetDescription>

          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3">{t('organization.classroom')}</h3>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : classroomData?.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            ) : (
              <div className="space-y-1">
                {classroomData?.data.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleOpenClassroom(c)}
                    className="w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(c.createdAt, DATE_FORMAT.DISPLAY)}
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ClassroomDetailDrawer
        classroom={selectedClassroom}
        open={classroomDrawerOpen}
        onClose={() => setClassroomDrawerOpen(false)}
      />
    </>
  )
}
