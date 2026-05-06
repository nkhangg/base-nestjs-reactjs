import { useState } from 'react'
import { Image } from 'lucide-react'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { Switch } from '@shared/components/ui/switch'
import { MediaPicker } from '@modules/media'
import { cn } from '@shared/utils'

const URL_KEY_PATTERN = /url|image|logo|src|photo|avatar/i

// ── JSON fallback (array / object) ─────────────────────────────────────────────

function JsonFallbackField({
  value,
  onChange,
}: {
  value: unknown
  onChange: (v: unknown) => void
}) {
  const [raw, setRaw] = useState(() => JSON.stringify(value, null, 2))
  const [hasError, setHasError] = useState(false)

  const handleChange = (text: string) => {
    setRaw(text)
    try {
      onChange(JSON.parse(text))
      setHasError(false)
    } catch {
      setHasError(true)
    }
  }

  return (
    <div className="space-y-1">
      <Textarea
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        rows={4}
        className={cn(
          'font-mono text-xs resize-y',
          hasError && 'border-red-300 focus-visible:ring-red-300',
        )}
      />
      {hasError && <p className="text-[10px] text-red-500">JSON không hợp lệ</p>}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface AutoFieldEditorProps {
  fieldKey: string
  value: unknown
  onChange: (v: unknown) => void
}

export function AutoFieldEditor({ fieldKey, value, onChange }: AutoFieldEditorProps) {
  const [mediaOpen, setMediaOpen] = useState(false)

  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center gap-3">
        <Switch checked={value} onCheckedChange={(checked) => onChange(checked)} />
        <span className="text-xs text-gray-400">{value ? 'true' : 'false'}</span>
      </div>
    )
  }

  if (typeof value === 'number') {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="font-mono text-sm"
      />
    )
  }

  if (typeof value === 'string') {
    const isUrl = URL_KEY_PATTERN.test(fieldKey)
    return (
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn('flex-1 text-sm', isUrl && 'font-mono text-xs')}
          placeholder={isUrl ? 'https://...' : undefined}
        />
        {isUrl && (
          <>
            <button
              type="button"
              onClick={() => setMediaOpen(true)}
              title="Chọn từ media library"
              className="flex items-center justify-center rounded-md border border-gray-200 px-2 text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-700"
            >
              <Image className="size-3.5" />
            </button>
            <MediaPicker
              open={mediaOpen}
              onClose={() => setMediaOpen(false)}
              onSelect={(file) => {
                onChange(file.url)
                setMediaOpen(false)
              }}
            />
          </>
        )}
      </div>
    )
  }

  return <JsonFallbackField value={value} onChange={onChange} />
}
