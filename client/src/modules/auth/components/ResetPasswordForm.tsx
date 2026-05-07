'use client'

import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@shared/utils'
import { useResetPassword } from '../hooks/useAuth'

const schema = z.object({
  newPassword: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

type FormValues = z.infer<typeof schema>

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const { mutate, isPending } = useResetPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => {
    mutate({ token, newPassword: values.newPassword })
  }

  return (
    <div className="rounded-2xl bg-card p-8 shadow-lg border border-border">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Đặt lại mật khẩu</h1>
        <p className="mt-1 text-sm text-muted-foreground">Nhập mật khẩu mới của bạn</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="newPassword">Mật khẩu mới</label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            className={cn(
              'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground',
              'focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring',
              errors.newPassword && 'border-destructive',
            )}
            {...register('newPassword')}
          />
          {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={cn(
              'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground',
              'focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring',
              errors.confirmPassword && 'border-destructive',
            )}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isPending || !token}
          className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
        </button>
      </form>
    </div>
  )
}
