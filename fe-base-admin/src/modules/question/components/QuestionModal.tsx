import { useEffect } from 'react'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { HelpCircle, Plus, Trash2, AlertTriangle, GripVertical } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { useCreateQuestion, useUpdateQuestion } from '../hooks/useQuestion'
import { QuestionPreviewCard } from './QuestionPreviewCard'
import type { Question, QuestionData, QuestionReferenceType, QuestionType } from '../types'

// ── Schemas ───────────────────────────────────────────────────────────────────

const quizSchema = z.object({
  type: z.literal('quiz'),
  prompt: z.string().min(1, 'Bắt buộc'),
  choices: z.array(z.string().min(1, 'Không được để trống')).min(2, 'Cần ít nhất 2 lựa chọn'),
  answer: z.string().min(1, 'Chọn đáp án'),
  explanation: z.string().optional(),
  jlptLevel: z.coerce.number().int().min(1).max(5).optional().or(z.literal('')),
})

const fillInBlankSchema = z.object({
  type: z.literal('fill_in_blank'),
  prompt: z.string().min(1, 'Bắt buộc'),
  answer: z.string().min(1, 'Bắt buộc'),
  explanation: z.string().optional(),
  jlptLevel: z.coerce.number().int().min(1).max(5).optional().or(z.literal('')),
})

const matchingSchema = z.object({
  type: z.literal('matching'),
  prompt: z.string().optional(),
  pairs: z
    .array(z.object({ left: z.string().min(1, 'Bắt buộc'), right: z.string().min(1, 'Bắt buộc') }))
    .min(2, 'Cần ít nhất 2 cặp'),
  explanation: z.string().optional(),
  jlptLevel: z.coerce.number().int().min(1).max(5).optional().or(z.literal('')),
})

const questionDataSchema = z.discriminatedUnion('type', [quizSchema, fillInBlankSchema, matchingSchema])

const formSchema = z.object({
  questionData: questionDataSchema,
  referenceType: z.enum(['article', 'dictionary', 'none']).default('none'),
  referenceId: z.string().optional(),
  isPublic: z.boolean().default(true),
})

type FormValues = z.infer<typeof formSchema>
type QuizValues = z.infer<typeof quizSchema>
type MatchingValues = z.infer<typeof matchingSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildQuestionData(values: FormValues): QuestionData {
  const qd = values.questionData
  if (qd.type === 'quiz') {
    return {
      type: 'quiz',
      prompt: qd.prompt,
      choices: qd.choices,
      answer: qd.answer,
      explanation: qd.explanation || undefined,
      jlptLevel: qd.jlptLevel ? Number(qd.jlptLevel) : undefined,
    }
  }
  if (qd.type === 'fill_in_blank') {
    return {
      type: 'fill_in_blank',
      prompt: qd.prompt,
      answer: qd.answer,
      explanation: qd.explanation || undefined,
      jlptLevel: qd.jlptLevel ? Number(qd.jlptLevel) : undefined,
    }
  }
  // matching
  const mv = qd as MatchingValues
  return {
    type: 'matching',
    prompt: mv.prompt || '',
    choices: mv.pairs.map((p) => p.left),
    answer: mv.pairs.map((p) => p.right),
    explanation: mv.explanation || undefined,
    jlptLevel: mv.jlptLevel ? Number(mv.jlptLevel) : undefined,
  }
}

function questionToFormValues(q: Question): FormValues {
  const qd = q.questionData
  let questionData: FormValues['questionData']

  if (qd.type === 'quiz') {
    questionData = {
      type: 'quiz',
      prompt: qd.prompt,
      choices: qd.choices ?? [],
      answer: String(qd.answer ?? ''),
      explanation: qd.explanation ?? '',
      jlptLevel: qd.jlptLevel ?? ('' as unknown as number),
    }
  } else if (qd.type === 'fill_in_blank') {
    questionData = {
      type: 'fill_in_blank',
      prompt: qd.prompt,
      answer: String(qd.answer ?? ''),
      explanation: qd.explanation ?? '',
      jlptLevel: qd.jlptLevel ?? ('' as unknown as number),
    }
  } else {
    const leftItems = qd.choices ?? []
    const rightItems = Array.isArray(qd.answer) ? (qd.answer as string[]) : []
    questionData = {
      type: 'matching',
      prompt: qd.prompt ?? '',
      pairs: leftItems.map((l, i) => ({ left: l, right: rightItems[i] ?? '' })),
      explanation: qd.explanation ?? '',
      jlptLevel: qd.jlptLevel ?? ('' as unknown as number),
    }
  }

  return {
    questionData,
    referenceType: q.referenceType ?? 'none',
    referenceId: q.referenceId ?? '',
    isPublic: q.isPublic,
  }
}

const DEFAULT_VALUES: FormValues = {
  questionData: { type: 'quiz', prompt: '', choices: ['', ''], answer: '', explanation: '' },
  referenceType: 'none',
  referenceId: '',
  isPublic: true,
}

const JLPT_OPTIONS = [1, 2, 3, 4, 5]

// ── Sub-form components ───────────────────────────────────────────────────────

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

function QuizSubForm({ control, register, errors, watch }: {
  control: ReturnType<typeof useForm<FormValues>>['control']
  register: ReturnType<typeof useForm<FormValues>>['register']
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors']
  watch: ReturnType<typeof useForm<FormValues>>['watch']
}) {
  const qErrors = errors.questionData as Record<string, { message?: string; [key: string]: unknown }> | undefined
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questionData.choices' as never,
  })
  const choices = watch('questionData') as QuizValues
  const currentChoices = choices?.choices ?? []

  return (
    <div className="space-y-4">
      <FormField label="Câu hỏi" required error={qErrors?.prompt?.message as string}>
        <Textarea
          placeholder="Nhập câu hỏi..."
          rows={2}
          {...register('questionData.prompt')}
          className="resize-none"
        />
      </FormField>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Lựa chọn <span className="ml-0.5 text-red-500">*</span>
          </FieldLabel>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => append('' as never)}
          >
            <Plus className="h-3 w-3" />
            Thêm
          </Button>
        </div>
        {qErrors?.choices?.message && (
          <FieldError className="text-xs">{qErrors.choices.message as string}</FieldError>
        )}
        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={field.id} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-center text-xs font-mono text-gray-400">
                {String.fromCharCode(65 + i)}
              </span>
              <Input
                placeholder={`Lựa chọn ${String.fromCharCode(65 + i)}`}
                {...register(`questionData.choices.${i}` as never)}
                className="flex-1"
              />
              {fields.length > 2 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <FormField label="Đáp án đúng" required error={qErrors?.answer?.message as string}>
        <Controller
          name={'questionData.answer' as never}
          control={control}
          render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Chọn đáp án..." />
              </SelectTrigger>
              <SelectContent>
                {currentChoices.filter(Boolean).map((c, i) => (
                  <SelectItem key={i} value={c}>
                    {String.fromCharCode(65 + i)}. {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField label="Giải thích">
        <Textarea
          placeholder="Giải thích đáp án (tùy chọn)..."
          rows={2}
          {...register('questionData.explanation')}
          className="resize-none"
        />
      </FormField>
    </div>
  )
}

function FillInBlankSubForm({ register, errors }: {
  register: ReturnType<typeof useForm<FormValues>>['register']
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors']
}) {
  const qErrors = errors.questionData as Record<string, { message?: string }> | undefined

  return (
    <div className="space-y-4">
      <FormField label="Câu hỏi (dùng ___ cho chỗ trống)" required error={qErrors?.prompt?.message}>
        <Textarea
          placeholder="Ví dụ: わたしは_____がすきです。"
          rows={2}
          {...register('questionData.prompt')}
          className="resize-none font-japanese"
        />
      </FormField>

      <FormField label="Đáp án" required error={qErrors?.answer?.message}>
        <Input
          placeholder="Điền đáp án đúng..."
          {...register('questionData.answer')}
        />
      </FormField>

      <FormField label="Giải thích">
        <Textarea
          placeholder="Giải thích đáp án (tùy chọn)..."
          rows={2}
          {...register('questionData.explanation')}
          className="resize-none"
        />
      </FormField>
    </div>
  )
}

function MatchingSubForm({ control, register, errors }: {
  control: ReturnType<typeof useForm<FormValues>>['control']
  register: ReturnType<typeof useForm<FormValues>>['register']
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors']
}) {
  const qErrors = errors.questionData as Record<string, { message?: string; [key: string]: unknown }> | undefined
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questionData.pairs' as never,
  })

  return (
    <div className="space-y-4">
      <FormField label="Mô tả (tùy chọn)">
        <Input
          placeholder="Mô tả bài ghép đôi..."
          {...register('questionData.prompt')}
        />
      </FormField>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Các cặp ghép <span className="ml-0.5 text-red-500">*</span>
          </FieldLabel>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => append({ left: '', right: '' } as never)}
          >
            <Plus className="h-3 w-3" />
            Thêm cặp
          </Button>
        </div>
        {qErrors?.pairs?.message && (
          <FieldError className="text-xs">{qErrors.pairs.message as string}</FieldError>
        )}
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_24px_1fr_24px] gap-2 px-1">
            <span className="text-xs font-medium text-purple-600">Cột trái</span>
            <span />
            <span className="text-xs font-medium text-orange-600">Cột phải</span>
            <span />
          </div>
          {fields.map((field, i) => {
            const pairErrors = (qErrors?.pairs as { [key: number]: { left?: { message?: string }; right?: { message?: string } } } | undefined)?.[i]
            return (
              <div key={field.id} className="grid grid-cols-[1fr_24px_1fr_24px] gap-2 items-start">
                <div>
                  <Input
                    placeholder={`Trái ${i + 1}`}
                    {...register(`questionData.pairs.${i}.left` as never)}
                    className={pairErrors?.left ? 'border-red-400' : ''}
                  />
                </div>
                <div className="flex items-center justify-center pt-2">
                  <GripVertical className="h-3.5 w-3.5 text-gray-300" />
                </div>
                <div>
                  <Input
                    placeholder={`Phải ${i + 1}`}
                    {...register(`questionData.pairs.${i}.right` as never)}
                    className={pairErrors?.right ? 'border-red-400' : ''}
                  />
                </div>
                <div className="flex items-center justify-center pt-2">
                  {fields.length > 2 && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <FormField label="Giải thích">
        <Textarea
          placeholder="Giải thích (tùy chọn)..."
          rows={2}
          {...register('questionData.explanation')}
          className="resize-none"
        />
      </FormField>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface QuestionModalProps {
  open: boolean
  onClose: () => void
  editingQuestion?: Question | null
}

const TYPE_LABELS: Record<QuestionType, string> = {
  quiz: 'Trắc nghiệm',
  fill_in_blank: 'Điền vào chỗ trống',
  matching: 'Ghép đôi',
}

const REFERENCE_LABELS: Record<QuestionReferenceType, string> = {
  none: 'Không liên kết',
  article: 'Bài đọc',
  dictionary: 'Từ điển',
}

export function QuestionModal({ open, onClose, editingQuestion }: QuestionModalProps) {
  const isEdit = !!editingQuestion
  const createQuestion = useCreateQuestion()
  const updateQuestion = useUpdateQuestion()
  const isPending = createQuestion.isPending || updateQuestion.isPending

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const selectedType = useWatch({ control, name: 'questionData.type' }) as QuestionType
  const referenceType = useWatch({ control, name: 'referenceType' })

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      if (editingQuestion) {
        reset(questionToFormValues(editingQuestion))
      } else {
        reset(DEFAULT_VALUES)
      }
    }
  }, [open, editingQuestion, reset])

  // Reset questionData sub-fields when type changes
  const handleTypeChange = (newType: QuestionType) => {
    if (newType === 'quiz') {
      setValue('questionData', { type: 'quiz', prompt: '', choices: ['', ''], answer: '', explanation: '' })
    } else if (newType === 'fill_in_blank') {
      setValue('questionData', { type: 'fill_in_blank', prompt: '', answer: '', explanation: '' })
    } else {
      setValue('questionData', { type: 'matching', prompt: '', pairs: [{ left: '', right: '' }, { left: '', right: '' }], explanation: '' })
    }
  }

  // Build live preview from current watch values
  const formValues = watch()
  const previewData: QuestionData | null = (() => {
    try {
      return buildQuestionData(formValues)
    } catch {
      return null
    }
  })()

  const onSubmit = (values: FormValues) => {
    const questionData = buildQuestionData(values)
    const payload = {
      questionData,
      referenceType: values.referenceType !== 'none' ? values.referenceType : undefined,
      referenceId: values.referenceType !== 'none' && values.referenceId ? values.referenceId : undefined,
      isPublic: values.isPublic,
    }

    if (isEdit && editingQuestion) {
      updateQuestion.mutate(
        { id: editingQuestion.id, dto: payload },
        {
          onSuccess: () => { toast.success('Cập nhật câu hỏi thành công'); reset(); onClose() },
          onError: () => toast.error('Cập nhật thất bại. Vui lòng thử lại.'),
        },
      )
    } else {
      createQuestion.mutate(payload, {
        onSuccess: () => { toast.success('Tạo câu hỏi thành công'); reset(); onClose() },
        onError: () => toast.error('Tạo thất bại. Vui lòng thử lại.'),
      })
    }
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-3xl gap-0 p-0 rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 shrink-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900">
            <HelpCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-gray-900">
              {isEdit ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {isEdit ? `ID: ${editingQuestion?.id.slice(0, 8)}...` : 'Câu hỏi JLPT / ngữ pháp'}
            </DialogDescription>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-1 flex-col overflow-y-auto px-6 py-5 space-y-5"
          >
            {/* Type selector */}
            <div className="space-y-1.5">
              <FieldLabel className="text-sm font-medium text-gray-700">
                Loại câu hỏi <span className="ml-0.5 text-red-500">*</span>
              </FieldLabel>
              <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1">
                {(['quiz', 'fill_in_blank', 'matching'] as QuestionType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedType === t
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* JLPT level — shared */}
            <div className="space-y-1.5">
              <FieldLabel className="text-sm font-medium text-gray-700">Cấp JLPT</FieldLabel>
              <Controller
                name={'questionData.jlptLevel' as never}
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : 'none'}
                    onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không phân cấp</SelectItem>
                      {JLPT_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>N{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Type-specific sub-form */}
            {selectedType === 'quiz' && (
              <QuizSubForm control={control} register={register} errors={errors} watch={watch} />
            )}
            {selectedType === 'fill_in_blank' && (
              <FillInBlankSubForm register={register} errors={errors} />
            )}
            {selectedType === 'matching' && (
              <MatchingSubForm control={control} register={register} errors={errors} />
            )}

            {/* Reference */}
            <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <FieldLabel className="text-sm font-medium text-gray-700">Liên kết nội dung</FieldLabel>
              <Controller
                name="referenceType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 text-sm bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['none', 'article', 'dictionary'] as QuestionReferenceType[]).map((r) => (
                        <SelectItem key={r} value={r}>{REFERENCE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              {referenceType !== 'none' && (
                <div className="space-y-1.5">
                  <FieldLabel className="text-sm font-medium text-gray-700">
                    ID {REFERENCE_LABELS[referenceType as QuestionReferenceType]}
                  </FieldLabel>
                  <Input
                    placeholder="Nhập ID..."
                    {...register('referenceId')}
                  />
                </div>
              )}
            </div>

            {/* isPublic */}
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
              <label htmlFor="isPublic" className="cursor-pointer select-none text-sm text-gray-700">
                Công khai <span className="text-xs text-gray-400">(hiển thị với người dùng)</span>
              </label>
            </div>

            {/* Root-level errors */}
            {errors.questionData && !errors.questionData.type && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Vui lòng kiểm tra lại dữ liệu câu hỏi.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1 pb-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={handleClose} disabled={isPending}>
                Huỷ
              </Button>
              <Button type="submit" className="flex-1" isLoading={isPending}>
                {isPending
                  ? isEdit ? 'Đang lưu...' : 'Đang tạo...'
                  : isEdit ? 'Lưu thay đổi' : 'Tạo câu hỏi'}
              </Button>
            </div>
          </form>

          {/* Right: preview */}
          <div className="hidden w-64 shrink-0 border-l border-gray-100 p-5 xl:flex xl:flex-col gap-3 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Xem trước</p>
            {previewData && previewData.prompt ? (
              <QuestionPreviewCard questionData={previewData} />
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
                Nhập nội dung để xem trước
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
