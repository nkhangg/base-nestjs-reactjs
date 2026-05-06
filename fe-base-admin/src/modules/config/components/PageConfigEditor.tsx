import { useState } from 'react'
import { LayoutTemplate, Code2, FormInput, AlertTriangle, RefreshCw } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@shared/components/ui/sheet'
import { Button } from '@shared/components/ui/button'
import { Textarea } from '@shared/components/ui/textarea'
import { Skeleton } from '@shared/components/ui/skeleton'
import { ConfirmDialog } from '@shared/components/ui/confirm-dialog'
import { cn } from '@shared/utils'
import { toast } from 'sonner'
import { usePageConfigs } from '../hooks/usePageConfigs'
import { useUpdateConfig } from '../hooks/useConfigs'
import { AutoFieldEditor } from './AutoFieldEditor'
import type { AppConfig } from '../types'

// ── Helpers ────────────────────────────────────────────────────────────────────

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function itemLabel(config: AppConfig): string {
  // pages.<section>.<rest...> → show <rest...>
  return config.key.split('.').slice(2).join('.') || config.key
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  sections: ReturnType<typeof usePageConfigs>['sections']
  selectedId: string | null
  onSelect: (config: AppConfig) => void
}

function Sidebar({ sections, selectedId, onSelect }: SidebarProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const s = new Set<string>()
    sections.forEach((sec) => s.add(sec.section))
    return s
  })

  const toggle = (section: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      next.has(section) ? next.delete(section) : next.add(section)
      return next
    })
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-xs text-gray-400">
        <LayoutTemplate className="size-8 text-gray-200" />
        <p>Chưa có config nào với prefix <span className="font-mono">pages.*</span></p>
      </div>
    )
  }

  return (
    <nav className="py-2">
      {sections.map((sec) => (
        <div key={sec.section}>
          <button
            onClick={() => toggle(sec.section)}
            className="flex w-full items-center justify-between px-4 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600"
          >
            {sec.section}
            <span className="text-[10px] text-gray-300">{sec.items.length}</span>
          </button>
          {openSections.has(sec.section) && (
            <ul>
              {sec.items.map((config) => (
                <li key={config.id}>
                  <button
                    onClick={() => onSelect(config)}
                    className={cn(
                      'w-full px-4 py-1.5 text-left text-sm transition-colors hover:bg-gray-50',
                      selectedId === config.id
                        ? 'bg-gray-100 font-medium text-gray-900'
                        : 'text-gray-600',
                    )}
                  >
                    {itemLabel(config)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  )
}

// ── Field form panel ───────────────────────────────────────────────────────────

interface FieldPanelProps {
  config: AppConfig
  editedValue: Record<string, unknown>
  onChange: (key: string, val: unknown) => void
  isDirty: boolean
  isSaving: boolean
  onSave: () => void
  rawMode: boolean
  rawText: string
  rawError: boolean
  onRawChange: (text: string) => void
  onToggleRaw: () => void
}

function FieldPanel({
  config,
  editedValue,
  onChange,
  isDirty,
  isSaving,
  onSave,
  rawMode,
  rawText,
  rawError,
  onRawChange,
  onToggleRaw,
}: FieldPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <p className="font-mono text-sm font-semibold text-gray-900">{config.key}</p>
          {config.description && (
            <p className="mt-0.5 text-xs text-gray-400">{config.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleRaw}
          disabled={rawMode && rawError}
          title={rawMode ? 'Chuyển về form' : 'Chỉnh sửa JSON thô'}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
            rawMode
              ? 'bg-gray-900 text-white'
              : 'border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700',
            rawMode && rawError && 'cursor-not-allowed opacity-50',
          )}
        >
          {rawMode ? <FormInput className="size-3" /> : <Code2 className="size-3" />}
          {rawMode ? 'Form' : 'Raw JSON'}
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {rawMode ? (
          <div className="space-y-1">
            <Textarea
              value={rawText}
              onChange={(e) => onRawChange(e.target.value)}
              rows={16}
              className={cn(
                'font-mono text-xs resize-none',
                rawError && 'border-red-300 focus-visible:ring-red-300',
              )}
            />
            {rawError && (
              <p className="flex items-center gap-1 text-[10px] text-red-500">
                <AlertTriangle className="size-3 shrink-0" />
                JSON không hợp lệ
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(editedValue).map(([key, val]) => (
              <div key={key} className="space-y-1.5">
                <label className="block font-mono text-xs font-medium text-gray-600">
                  {key}
                </label>
                <AutoFieldEditor
                  fieldKey={key}
                  value={val}
                  onChange={(v) => onChange(key, v)}
                />
              </div>
            ))}
            {Object.keys(editedValue).length === 0 && (
              <p className="text-sm text-gray-400">Value rỗng — chuyển sang Raw JSON để thêm fields.</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-6 py-4">
        <Button
          onClick={onSave}
          disabled={!isDirty || isSaving || (rawMode && rawError)}
          isLoading={isSaving}
          className="w-full"
        >
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface PageConfigEditorProps {
  open: boolean
  onClose: () => void
}

export function PageConfigEditor({ open, onClose }: PageConfigEditorProps) {
  const { sections, isLoading, isError, refetch } = usePageConfigs()
  const updateConfig = useUpdateConfig()

  const [selectedConfig, setSelectedConfig] = useState<AppConfig | null>(null)
  const [editedValue, setEditedValue] = useState<Record<string, unknown>>({})
  const [isDirty, setIsDirty] = useState(false)

  const [rawMode, setRawMode] = useState(false)
  const [rawText, setRawText] = useState('')
  const [rawError, setRawError] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingSwitch, setPendingSwitch] = useState<AppConfig | null>(null)

  const selectConfig = (config: AppConfig) => {
    const parsed = isPlainObject(config.value) ? (config.value as Record<string, unknown>) : {}
    setSelectedConfig(config)
    setEditedValue(parsed)
    setRawMode(false)
    setRawText(JSON.stringify(parsed, null, 2))
    setRawError(false)
    setIsDirty(false)
  }

  const handleSelect = (config: AppConfig) => {
    if (isDirty && selectedConfig?.id !== config.id) {
      setPendingSwitch(config)
      setConfirmOpen(true)
    } else {
      selectConfig(config)
    }
  }

  const handleConfirmSwitch = () => {
    if (pendingSwitch) selectConfig(pendingSwitch)
    setPendingSwitch(null)
    setConfirmOpen(false)
  }

  const handleFieldChange = (key: string, val: unknown) => {
    const next = { ...editedValue, [key]: val }
    setEditedValue(next)
    setRawText(JSON.stringify(next, null, 2))
    setIsDirty(true)
  }

  const handleRawChange = (text: string) => {
    setRawText(text)
    try {
      const parsed = JSON.parse(text)
      if (isPlainObject(parsed)) {
        setEditedValue(parsed)
        setRawError(false)
        setIsDirty(true)
      } else {
        setRawError(true)
      }
    } catch {
      setRawError(true)
    }
  }

  const handleToggleRaw = () => {
    if (rawMode && rawError) return
    if (!rawMode) setRawText(JSON.stringify(editedValue, null, 2))
    setRawMode((v) => !v)
  }

  const handleSave = () => {
    if (!selectedConfig) return
    updateConfig.mutate(
      {
        id: selectedConfig.id,
        value: editedValue,
        valueKeyOrder: Object.keys(editedValue),
      },
      {
        onSuccess: () => {
          toast.success('Đã lưu config')
          setIsDirty(false)
        },
        onError: () => toast.error('Lưu thất bại'),
      },
    )
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
        <SheetContent side="right" className="sm:max-w-3xl p-0 flex flex-col">
          <SheetHeader className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-900">
                <LayoutTemplate className="size-4 text-white" />
              </div>
              <div>
                <SheetTitle className="text-base">Page Config Editor</SheetTitle>
                <SheetDescription className="text-xs">
                  Chỉnh sửa configs có prefix <span className="font-mono">pages.*</span>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-52 shrink-0 overflow-y-auto border-r border-gray-100">
              {isLoading && (
                <div className="space-y-2 p-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full rounded" />
                  ))}
                </div>
              )}
              {isError && (
                <div className="flex flex-col items-center gap-2 p-4 text-center text-xs text-gray-400">
                  <AlertTriangle className="size-5 text-red-400" />
                  <p>Không thể tải config</p>
                  <button
                    onClick={() => refetch()}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-800"
                  >
                    <RefreshCw className="size-3" /> Thử lại
                  </button>
                </div>
              )}
              {!isLoading && !isError && (
                <Sidebar
                  sections={sections}
                  selectedId={selectedConfig?.id ?? null}
                  onSelect={handleSelect}
                />
              )}
            </aside>

            {/* Panel */}
            <main className="flex flex-1 flex-col overflow-hidden">
              {!selectedConfig ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-gray-400">
                  <LayoutTemplate className="size-10 text-gray-200" />
                  <p>Chọn một config từ sidebar</p>
                </div>
              ) : (
                <FieldPanel
                  key={selectedConfig.id}
                  config={selectedConfig}
                  editedValue={editedValue}
                  onChange={handleFieldChange}
                  isDirty={isDirty}
                  isSaving={updateConfig.isPending}
                  onSave={handleSave}
                  rawMode={rawMode}
                  rawText={rawText}
                  rawError={rawError}
                  onRawChange={handleRawChange}
                  onToggleRaw={handleToggleRaw}
                />
              )}
            </main>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingSwitch(null) }}
        onConfirm={handleConfirmSwitch}
        title="Bỏ qua thay đổi?"
        description="Bạn có thay đổi chưa lưu. Chuyển sang config khác sẽ mất những thay đổi này."
        confirmLabel="Bỏ qua"
        cancelLabel="Ở lại"
        variant="warning"
      />
    </>
  )
}
