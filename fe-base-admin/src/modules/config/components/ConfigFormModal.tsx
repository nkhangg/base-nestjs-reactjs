import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Settings, AlertTriangle, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { FieldLabel, FieldError } from '@shared/components/ui/field'
import { useCreateConfig, useUpdateConfig } from '../hooks/useConfigs'
import type { AppConfig, ConfigScope } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────

const SCOPE_OPTIONS: { value: ConfigScope; label: string; description: string }[] = [
  { value: 'public', label: 'Public', description: 'Ai cũng đọc được' },
  { value: 'members', label: 'Members', description: 'User đã đăng nhập' },
  { value: 'internal', label: 'Internal', description: 'Chỉ dành cho admin' },
]

const KEY_PATTERN = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*$/

// ── Schema ────────────────────────────────────────────────────────────────────

const formSchema = z.object({
  key: z
    .string()
    .min(1, 'Bắt buộc')
    .max(128, 'Tối đa 128 ký tự')
    .regex(KEY_PATTERN, 'Dạng dot-notation: chữ thường, số, gạch ngang (vd: homepage.hero)'),
  value: z.string().min(1, 'Bắt buộc').refine((v) => {
    try { JSON.parse(v); return true } catch { return false }
  }, 'JSON không hợp lệ'),
  description: z.string().optional(),
  scope: z.enum(['public', 'members', 'internal']),
  tags: z.array(z.string()).default([]),
})

type FormValues = z.infer<typeof formSchema>

// ── TagInput ──────────────────────────────────────────────────────────────────

function TagInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setInput('')
  }

  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag))

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className="border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border bg-transparent px-2 py-1 transition-colors cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input) }}
        placeholder={value.length === 0 ? 'homepage, layout... (Enter để thêm)' : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}

// ── FormField ─────────────────────────────────────────────────────────────────

function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <FieldLabel className="text-sm font-medium text-gray-700">{label}</FieldLabel>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
      {error && <FieldError className="text-xs">{error}</FieldError>}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ConfigFormModalProps {
  open: boolean
  onClose: () => void
  editingConfig?: AppConfig | null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ConfigFormModal({ open, onClose, editingConfig }: ConfigFormModalProps) {
  const isEdit = !!editingConfig
  const createConfig = useCreateConfig()
  const updateConfig = useUpdateConfig()
  const isPending = createConfig.isPending || updateConfig.isPending
  const isError = createConfig.isError || updateConfig.isError

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { scope: 'public', tags: [] },
  })

  useEffect(() => {
    if (editingConfig) {
      reset({
        key: editingConfig.key,
        value: JSON.stringify(editingConfig.value, null, 2),
        description: editingConfig.description ?? '',
        scope: editingConfig.scope,
        tags: editingConfig.tags,
      })
    } else {
      reset({ key: '', value: '', description: '', scope: 'public', tags: [] })
    }
  }, [editingConfig, reset])

  const onSubmit = (values: FormValues) => {
    const payload = {
      value: JSON.parse(values.value),
      description: values.description || undefined,
      scope: values.scope,
      tags: values.tags,
    }

    if (isEdit && editingConfig) {
      updateConfig.mutate(
        { id: editingConfig.id, ...payload },
        { onSuccess: () => { reset(); onClose() } },
      )
    } else {
      createConfig.mutate(
        { key: values.key, ...payload },
        { onSuccess: () => { reset(); onClose() } },
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { if (!o) { reset(); onClose() } }}
    >
      <DialogContent className="max-w-xl gap-0 p-0 rounded-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 pr-12">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900">
            <Settings className="h-4 w-4 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-gray-900">
              {isEdit ? 'Chỉnh sửa config' : 'Tạo config mới'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {isEdit ? editingConfig?.key : 'Lưu trữ cấu hình dạng JSON tự do'}
            </DialogDescription>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5">
          {/* Key */}
          <FormField label="Key" hint="dot-notation" error={errors.key?.message}>
            <Input
              placeholder="homepage.hero"
              disabled={isEdit}
              aria-invalid={!!errors.key}
              {...register('key')}
              className={isEdit ? 'bg-gray-50 font-mono text-sm' : 'font-mono text-sm'}
            />
          </FormField>

          {/* Value (JSON) */}
          <FormField label="Value (JSON)" error={errors.value?.message}>
            <Textarea
              placeholder='{ "title": "Hello", "image": "..." }'
              rows={6}
              aria-invalid={!!errors.value}
              {...register('value')}
              className="font-mono text-xs resize-none"
            />
          </FormField>

          {/* Scope + Tags — 2 columns */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Scope" error={errors.scope?.message}>
              <Controller
                control={control}
                name="scope"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue>
                        {field.value
                          ? SCOPE_OPTIONS.find((s) => s.value === field.value)?.label
                          : <span className="text-muted-foreground">Chọn scope...</span>}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {SCOPE_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value} textValue={s.label}>
                          <div>
                            <p className="text-sm font-medium">{s.label}</p>
                            <p className="text-xs text-gray-400">{s.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Tags" hint="Enter để thêm">
              <Controller
                control={control}
                name="tags"
                render={({ field }) => (
                  <TagInput value={field.value} onChange={field.onChange} />
                )}
              />
            </FormField>
          </div>

          {/* Description */}
          <FormField label="Mô tả" error={errors.description?.message}>
            <Textarea
              placeholder="Mô tả ngắn cho admin..."
              rows={2}
              {...register('description')}
              className="resize-none text-sm"
            />
          </FormField>

          {/* Error */}
          {isError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {isEdit ? 'Cập nhật thất bại.' : 'Tạo thất bại. Key có thể đã tồn tại.'}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => { reset(); onClose() }}
              disabled={isPending}
            >
              Huỷ
            </Button>
            <Button type="submit" className="flex-1" isLoading={isPending}>
              {isPending
                ? isEdit ? 'Đang lưu...' : 'Đang tạo...'
                : isEdit ? 'Lưu thay đổi' : 'Tạo config'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
