'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { cn } from '@shared/utils'
import { useForgotPassword } from '../hooks/useAuth'
import { ROUTES } from '@config/routes'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

type FormValues = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const { mutate, isPending } = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => {
    mutate(values, {
      onSuccess: () => {
        setSent(true)
        toast.success('Email đặt lại mật khẩu đã được gửi')
      },
      onError: () => toast.error('Không tìm thấy tài khoản với email này'),
    })
  }

  if (sent) {
    return (
      <div className="rounded-2xl bg-card p-8 shadow-lg border border-border text-center">
        <h2 className="text-lg font-semibold text-foreground">Kiểm tra email của bạn</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Chúng tôi đã gửi link đặt lại mật khẩu vào email của bạn.
        </p>
        <Link href={ROUTES.LOGIN} className="mt-4 inline-block text-sm text-foreground font-medium hover:underline">
          Quay lại đăng nhập
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-card p-8 shadow-lg border border-border">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Quên mật khẩu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nhập email để nhận link đặt lại mật khẩu
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="email@example.com"
            className={cn(
              'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground',
              'placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring',
              errors.email && 'border-destructive',
            )}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href={ROUTES.LOGIN} className="text-foreground font-medium hover:underline">Quay lại đăng nhập</Link>
      </p>
    </div>
  )
}
