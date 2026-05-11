'use client'

import Link from 'next/link'
import { ROUTES } from '@config/routes'
import { cn } from '@shared/utils'
import type { UsageStat } from '../types'

interface Props {
  stats: UsageStat[]
}

const TONE_FILL: Record<UsageStat['tone'], string> = {
  neutral: 'bg-foreground',
  warning: 'bg-amber-500',
  danger: 'bg-destructive',
}

export function UsageStatsGrid({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => (
        <div
          key={s.id}
          className="rounded-xl border border-border bg-card p-5"
        >
          <p className="text-[11px] text-muted-foreground">{s.label}</p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
            {s.used} / {s.limit}
          </p>
          <div className="mt-2 h-[5px] w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-all', TONE_FILL[s.tone])}
              style={{ width: `${Math.min(s.percent, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {s.sub}
            {s.upgradeLink ? (
              <>
                {' · '}
                <Link
                  href={ROUTES.BILLING}
                  className="font-medium text-teal-600 hover:underline"
                >
                  Nâng cấp →
                </Link>
              </>
            ) : null}
          </p>
        </div>
      ))}
    </div>
  )
}
