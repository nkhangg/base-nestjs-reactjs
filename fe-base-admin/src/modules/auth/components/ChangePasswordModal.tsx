import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@shared/utils'
import { useChangePassword } from '../hooks/useAuth'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
}

function PasswordField({
  id,
  label,
  error,
  registration,
}: {
  id: string
  label: string
  error?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete="off"
          className={cn(
            'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-900',
            'placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-400',
          )}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function ChangePasswordModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  const { mutateAsync, isPending } = useChangePassword()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (!open) return null

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    try {
      await mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      handleClose()
    } catch {
      // error handled by mutation onError (toast)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-5 text-base font-semibold text-gray-900">{t('auth.changePasswordTitle')}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <PasswordField
            id="currentPassword"
            label={t('auth.currentPassword')}
            error={errors.currentPassword?.message}
            registration={register('currentPassword')}
          />
          <PasswordField
            id="newPassword"
            label={t('auth.newPassword')}
            error={errors.newPassword?.message}
            registration={register('newPassword')}
          />
          <PasswordField
            id="confirmPassword"
            label={t('auth.confirmNewPassword')}
            error={errors.confirmPassword?.message}
            registration={register('confirmPassword')}
          />

          <div className="mt-1 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-10 rounded-lg bg-zinc-900 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? t('auth.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
