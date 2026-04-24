import { cn } from '@shared/utils'
import type { FilterPreset, FilterState } from './types'

interface FilterPresetsProps {
  presets: FilterPreset[]
  currentFilters: FilterState
  currentSearch: string
  onApply: (preset: FilterPreset) => void
  onClear: () => void
}

function isPresetActive(preset: FilterPreset, filters: FilterState, search: string): boolean {
  const filterKeys = Object.keys(preset.filters)
  if (filterKeys.length === 0 && !preset.search) return false

  const filtersMatch = filterKeys.every(key => {
    const pv = preset.filters[key]
    const cv = filters[key]
    if (!cv) return false
    return JSON.stringify(pv.value) === JSON.stringify(cv.value)
  })

  const searchMatch = preset.search !== undefined ? preset.search === search : true
  return filtersMatch && searchMatch
}

export function FilterPresets({
  presets,
  currentFilters,
  currentSearch,
  onApply,
  onClear,
}: FilterPresetsProps) {
  if (presets.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {presets.map(preset => {
        const active = isPresetActive(preset, currentFilters, currentSearch)
        return (
          <button
            key={preset.label}
            type="button"
            onClick={() => (active ? onClear() : onApply(preset))}
            className={cn(
              'inline-flex h-6 items-center rounded-full border px-3 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                : 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {preset.label}
            {active && <span className="ml-1 opacity-70">×</span>}
          </button>
        )
      })}
    </div>
  )
}
