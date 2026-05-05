import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@shared/utils'
import { useResetPassword } from '../hooks/useAuth'
import { ROUTES } from '@config/routes'

const schema = z
  .object({
    token: z.string().min(1, 'Vui lòng nhập token'),
    newPassword: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token') ?? ''

  const { mutateAsync, isPending } = useResetPassword()
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { token: tokenFromUrl },
  })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      await mutateAsync({ token: values.token, newPassword: values.newPassword })
    } catch {
      setError('Token không hợp lệ hoặc đã hết hạn')
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 p-8 shadow-xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white">Đặt lại mật khẩu</h1>
          <p className="mt-1 text-sm text-zinc-400">Nhập token và mật khẩu mới của bạn</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Token */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white" htmlFor="token">
              Token
            </label>
            <input
              id="token"
              type="text"
              placeholder="Dán token vào đây"
              className={cn(
                'h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 font-mono text-xs text-white',
                'placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500',
                errors.token && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              )}
              {...register('token')}
            />
            {errors.token && <p className="text-xs text-red-400">{errors.token.message}</p>}
          </div>

          {/* New password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white" htmlFor="newPassword">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                className={cn(
                  'h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 pr-10 text-sm text-white',
                  'placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500',
                  errors.newPassword && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                )}
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-400">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white" htmlFor="confirmPassword">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                className={cn(
                  'h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 pr-10 text-sm text-white',
                  'placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500',
                  errors.confirmPassword && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                )}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 h-10 w-full rounded-lg bg-white text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <Link
          to={ROUTES.LOGIN}
          className="mt-4 block text-center text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  )
}
