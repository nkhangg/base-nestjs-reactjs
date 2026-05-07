import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookOpen, AlertTriangle, FormInput, Braces } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { FieldLabel, FieldError } from '@shared/components/ui/field'
import { Checkbox } from '@shared/components/ui/checkbox'
import { useCreateDictionary, useUpdateDictionary } from '../hooks/useDictionary'
import { MeaningsInput } from './MeaningsInput'
import type { DictionaryEntry } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────

const JLPT_OPTIONS = [
  { label: 'N1', value: 1 },
  { label: 'N2', value: 2 },
  { label: 'N3', value: 3 },
  { label: 'N4', value: 4 },
  { label: 'N5', value: 5 },
]

const JSON_PLACEHOLDER = `{
  "hiragana": "いえ",
  "romaji": "ie",
  "kanji": "家",
  "meanings": ["nhà", "tòa nhà", "gia đình"],
  "jlptLevel": 4,
  "isPublic": true
}`

// ── Schemas ───────────────────────────────────────────────────────────────────

const formSchema = z.object({
  kanji: z.string().optional(),
  hiragana: z.string().min(1, 'Bắt buộc'),
  romaji: z.string().min(1, 'Bắt buộc'),
  meanings: z.array(z.string()).min(1, 'Cần ít nhất 1 nghĩa'),
  jlptLevel: z.coerce.number().optional(),
  isPublic: z.boolean(),
})

const jsonSchema = z.object({
  hiragana: z.string().min(1, 'hiragana là bắt buộc'),
  romaji: z.string().min(1, 'romaji là bắt buộc'),
  kanji: z.string().optional(),
  meanings: z.array(z.string()).min(1, 'meanings phải có ít nhất 1 phần tử'),
  jlptLevel: z.number().int().min(1).max(5).optional(),
  isPublic: z.boolean().optional(),
})

type FormValues = z.infer<typeof formSchema>
type InputMode = 'form' | 'json'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formValuesToJson(values: FormValues): string {
  const obj: Record<string, unknown> = {
    hiragana: values.hiragana,
    romaji: values.romaji,
  }
  if (values.kanji) obj.kanji = values.kanji
  if (values.meanings.length) obj.meanings = values.meanings
  if (values.jlptLevel) obj.jlptLevel = values.jlptLevel
  obj.isPublic = values.isPublic
  return JSON.stringify(obj, null, 2)
}

function entryToJson(entry: DictionaryEntry): string {
  const obj: Record<string, unknown> = {
    hiragana: entry.hiragana,
    romaji: entry.romaji,
  }
  if (entry.kanji) obj.kanji = entry.kanji
  obj.meanings = entry.meanings
  if (entry.jlptLevel) obj.jlptLevel = entry.jlptLevel
  obj.isPublic = entry.isPublic
  return JSON.stringify(obj, null, 2)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </FieldLabel>
      {children}
      {error && <FieldError className="text-xs">{error}</FieldError>}
    </div>
  )
}

function ModeToggle({
  mode,
  onChange,
  disabled,
}: {
  mode: InputMode
  onChange: (m: InputMode) => void
  disabled?: boolean
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 bg-gray-100 p-0.5">
      {(['form', 'json'] as const).map((m) => (
        <button
          key={m}
          type="button"
          disabled={disabled}
          onClick={() => onChange(m)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
            mode === m
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {m === 'form' ? (
            <><FormInput className="h-3 w-3" />Form</>
          ) : (
            <><Braces className="h-3 w-3" />JSON</>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface DictionaryEntryModalProps {
  open: boolean
  onClose: () => void
  editingEntry?: DictionaryEntry | null
}

export function DictionaryEntryModal({ open, onClose, editingEntry }: DictionaryEntryModalProps) {
  const isEdit = !!editingEntry
  const createEntry = useCreateDictionary()
  const updateEntry = useUpdateDictionary()
  const isPending = createEntry.isPending || updateEntry.isPending

  const [mode, setMode] = useState<InputMode>('form')
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { meanings: [], isPublic: true },
  })

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setMode('form')
      setJsonError(null)
      setApiError(null)
      if (editingEntry) {
        reset({
          kanji: editingEntry.kanji ?? '',
          hiragana: editingEntry.hiragana,
          romaji: editingEntry.romaji,
          meanings: editingEntry.meanings,
          jlptLevel: editingEntry.jlptLevel ?? undefined,
          isPublic: editingEntry.isPublic,
        })
        setJsonText(entryToJson(editingEntry))
      } else {
        reset({ kanji: '', hiragana: '', romaji: '', meanings: [], jlptLevel: undefined, isPublic: true })
        setJsonText('')
      }
    }
  }, [open, editingEntry, reset])

  // Sync between modes
  const handleModeChange = (next: InputMode) => {
    setJsonError(null)
    setApiError(null)

    if (next === 'json') {
      // Form → JSON: serialize current form values
      const current = getValues()
      const hasContent = current.hiragana || current.romaji || current.meanings.length > 0
      setJsonText(hasContent ? formValuesToJson(current) : JSON_PLACEHOLDER)
    } else {
      // JSON → Form: try to parse and populate
      if (jsonText.trim()) {
        try {
          const parsed = JSON.parse(jsonText)
          const result = jsonSchema.safeParse(parsed)
          if (result.success) {
            setValue('hiragana', result.data.hiragana)
            setValue('romaji', result.data.romaji)
            setValue('kanji', result.data.kanji ?? '')
            setValue('meanings', result.data.meanings)
            setValue('jlptLevel', result.data.jlptLevel)
            setValue('isPublic', result.data.isPublic ?? true)
          }
          // If invalid, switch anyway — form will show its own validation on submit
        } catch {
          // Not valid JSON — switch to form anyway without populating
        }
      }
    }

    setMode(next)
  }

  const buildPayload = (values: FormValues) => ({
    kanji: values.kanji || undefined,
    hiragana: values.hiragana,
    romaji: values.romaji,
    meanings: values.meanings,
    jlptLevel: values.jlptLevel || undefined,
    isPublic: values.isPublic,
  })

  const submitPayload = (payload: ReturnType<typeof buildPayload>) => {
    setApiError(null)
    if (isEdit && editingEntry) {
      updateEntry.mutate(
        { id: editingEntry.id, dto: payload },
        {
          onSuccess: () => { toast.success('Cập nhật từ thành công'); reset(); onClose() },
          onError: () => { setApiError('Cập nhật thất bại. Vui lòng thử lại.') },
        },
      )
    } else {
      createEntry.mutate(payload, {
        onSuccess: () => { toast.success('Tạo từ thành công'); reset(); onClose() },
        onError: () => { setApiError('Tạo thất bại. Vui lòng thử lại.') },
      })
    }
  }

  // Form submit
  const onFormSubmit = (values: FormValues) => submitPayload(buildPayload(values))

  // JSON submit
  const onJsonSubmit = () => {
    setJsonError(null)
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      setJsonError('JSON không hợp lệ. Kiểm tra lại cú pháp.')
      return
    }
    const result = jsonSchema.safeParse(parsed)
    if (!result.success) {
      const msg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      setJsonError(`Dữ liệu không hợp lệ — ${msg}`)
      return
    }
    submitPayload({
      hiragana: result.data.hiragana,
      romaji: result.data.romaji,
      kanji: result.data.kanji || undefined,
      meanings: result.data.meanings,
      jlptLevel: result.data.jlptLevel,
      isPublic: result.data.isPublic ?? true,
    })
  }

  const handleClose = () => { reset(); setJsonText(''); setJsonError(null); setApiError(null); onClose() }
  const isPublic = watch('isPublic')

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-lg gap-0 p-0 rounded-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4 pr-12">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-gray-900">
                {isEdit ? 'Chỉnh sửa từ' : 'Thêm từ mới'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                {isEdit ? editingEntry?.hiragana : 'Từ vựng tiếng Nhật'}
              </DialogDescription>
            </div>
          </div>
          <ModeToggle mode={mode} onChange={handleModeChange} disabled={isPending} />
        </div>

        {/* ── Form mode ── */}
        {mode === 'form' && (
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Kanji" error={errors.kanji?.message}>
                <Input
                  placeholder="漢字"
                  {...register('kanji')}
                  className="font-japanese text-base"
                />
              </FormField>
              <FormField label="JLPT Level">
                <select
                  {...register('jlptLevel')}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Không rõ</option>
                  {JLPT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Hiragana" required error={errors.hiragana?.message}>
                <Input
                  placeholder="ひらがな"
                  {...register('hiragana')}
                  aria-invalid={!!errors.hiragana}
                  className="font-japanese text-base"
                />
              </FormField>
              <FormField label="Romaji" required error={errors.romaji?.message}>
                <Input
                  placeholder="hiragana"
                  {...register('romaji')}
                  aria-invalid={!!errors.romaji}
                />
              </FormField>
            </div>

            <FormField label="Nghĩa" required error={errors.meanings?.message}>
              <Controller
                name="meanings"
                control={control}
                render={({ field }) => (
                  <MeaningsInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Nhập nghĩa rồi Enter (ví dụ: cái nhà, tòa nhà)"
                  />
                )}
              />
            </FormField>

            <div className="flex items-center gap-2">
              <Controller
                name="isPublic"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="isPublic"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700 cursor-pointer select-none">
                Công khai{' '}
                <span className="text-xs text-gray-400">
                  ({isPublic ? 'hiển thị với người dùng' : 'chỉ nội bộ'})
                </span>
              </label>
            </div>

            {apiError && <ErrorBanner message={apiError} />}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="secondary" className="flex-1" onClick={handleClose} disabled={isPending}>
                Huỷ
              </Button>
              <Button type="submit" className="flex-1" isLoading={isPending}>
                {isPending
                  ? isEdit ? 'Đang lưu...' : 'Đang tạo...'
                  : isEdit ? 'Lưu thay đổi' : 'Thêm từ'}
              </Button>
            </div>
          </form>
        )}

        {/* ── JSON mode ── */}
        {mode === 'json' && (
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <FieldLabel className="text-sm font-medium text-gray-700">
                  JSON <span className="text-red-500">*</span>
                </FieldLabel>
                <span className="text-xs text-gray-400">
                  hiragana, romaji, meanings là bắt buộc
                </span>
              </div>
              <Textarea
                value={jsonText}
                onChange={(e) => { setJsonText(e.target.value); setJsonError(null) }}
                placeholder={JSON_PLACEHOLDER}
                rows={12}
                className="resize-none font-mono text-sm leading-relaxed"
                spellCheck={false}
              />
              {jsonError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {jsonError}
                </div>
              )}
            </div>

            {/* Schema hint */}
            <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-500 font-mono leading-relaxed">
              <span className="font-semibold text-gray-700">Schema:</span>{' '}
              hiragana<span className="text-red-500">*</span>{' '}
              romaji<span className="text-red-500">*</span>{' '}
              meanings<span className="text-red-500">*</span>{'[]  '}
              kanji?{'  '}
              jlptLevel?{'  '}
              isPublic?
            </div>

            {apiError && <ErrorBanner message={apiError} />}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="secondary" className="flex-1" onClick={handleClose} disabled={isPending}>
                Huỷ
              </Button>
              <Button
                type="button"
                className="flex-1"
                isLoading={isPending}
                onClick={onJsonSubmit}
              >
                {isPending
                  ? isEdit ? 'Đang lưu...' : 'Đang tạo...'
                  : isEdit ? 'Lưu thay đổi' : 'Thêm từ'}
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {message}
    </div>
  )
}
