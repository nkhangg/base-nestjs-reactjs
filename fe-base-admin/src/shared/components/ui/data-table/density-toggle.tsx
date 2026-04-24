import type { ReactNode } from 'react'
import { AlignJustify, LayoutList, Rows3 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/components/ui/tooltip'
import { ToggleGroup, ToggleGroupItem } from '@shared/components/ui/toggle-group'
import type { TableDensity } from './types'

interface DensityOption {
  value: TableDensity
  label: string
  icon: ReactNode
}

const OPTIONS: DensityOption[] = [
  { value: 'compact', label: 'Compact', icon: <Rows3 className="h-3.5 w-3.5" /> },
  { value: 'default', label: 'Default', icon: <LayoutList className="h-3.5 w-3.5" /> },
  { value: 'comfortable', label: 'Comfortable', icon: <AlignJustify className="h-3.5 w-3.5" /> },
]

interface DensityToggleProps {
  density: TableDensity
  onChange: (density: TableDensity) => void
}

export function DensityToggle({ density, onChange }: DensityToggleProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <ToggleGroup
        type="single"
        value={density}
        onValueChange={v => { if (v) onChange(v as TableDensity) }}
        size="sm"
        variant="outline"
        className="h-8 gap-0 divide-x divide-input rounded-md border border-input p-0 [&>*]:rounded-none [&>*]:border-0 [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md"
      >
        {OPTIONS.map(opt => (
          <Tooltip key={opt.value}>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value={opt.value}
                aria-label={opt.label}
                className="h-8 w-8 p-0"
              >
                {opt.icon}
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{opt.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </ToggleGroup>
    </TooltipProvider>
  )
}
