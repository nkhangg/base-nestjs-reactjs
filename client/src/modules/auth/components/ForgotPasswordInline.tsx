'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@shared/utils'
import { useForgotPassword } from '../hooks/useAuth'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onBack: () => void
}

export function ForgotPasswordInline({ onBack }: Props) {
  const [sent, setSent] = useState(false)
  const { mutate, isPending } = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => {
    mutate(values, { onSuccess: () => setSent(true) })
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1 text-[13px] text-[#7A7A85] transition-colors hover:text-[#0D0D0F]"
      >
        ← Quay lại đăng nhập
      </button>

      <div className="mb-7">
        <h2 className="text-[22px] font-semibold tracking-tight text-[#0D0D0F]">Đặt lại mật khẩu</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#7A7A85]">
          Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="block text-xs font-medium text-[#3A3A40]" htmlFor="forgot-email">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="ten@example.com"
            className={cn(
              'h-[42px] w-full rounded-2xl border-[1.5px] bg-white px-3 text-sm text-[#0D0D0F] outline-none transition-all',
              'placeholder:text-[#ADADB8]',
              'border-[rgba(13,13,15,0.14)] focus:border-[#0D0D0F] focus:shadow-[0_0_0_3px_rgba(13,13,15,0.06)]',
              errors.email && 'border-[#E8334A] focus:border-[#E8334A]',
            )}
            {...register('email')}
          />
          {errors.email && <p className="text-[11px] text-[#E8334A]">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isPending || sent}
          className="h-[46px] w-full rounded-2xl bg-[#0D0D0F] text-[15px] font-semibold tracking-tight text-white transition-all hover:-translate-y-px hover:bg-[#2a2a30] hover:shadow-[0_4px_12px_rgba(13,13,15,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Đang gửi...' : 'Gửi link đặt lại →'}
        </button>
      </form>

      {sent && (
        <div className="mt-4 rounded-lg border-l-[3px] border-teal-600 bg-[#E8F7F4] px-4 py-3">
          <p className="text-[13px] font-semibold text-teal-700">✓ Email đã được gửi!</p>
          <p className="mt-0.5 text-xs text-[#7A7A85]">
            Kiểm tra hộp thư đến và làm theo hướng dẫn.
          </p>
        </div>
      )}
    </div>
  )
}
