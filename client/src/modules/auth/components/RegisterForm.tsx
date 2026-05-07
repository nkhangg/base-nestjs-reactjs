'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@shared/utils'
import { useRegister } from '../hooks/useAuth'
import { GoogleIcon } from './GoogleIcon'
import { PasswordStrengthBar } from './PasswordStrengthBar'

const schema = z.object({
  firstName: z.string().min(1, 'Vui lòng nhập họ'),
  lastName: z.string().min(1, 'Vui lòng nhập tên'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  agreeTerms: z
    .boolean()
    .refine((v) => v === true, { message: 'Vui lòng đồng ý với điều khoản' }),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSwitchToLogin }: Props) {
  const { mutate: registerUser, isPending } = useRegister()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const password = watch('password', '')

  const onSubmit = (values: FormValues) => {
    const { firstName, lastName, email, password } = values
    registerUser({ email, password, firstName, lastName, name: `${firstName} ${lastName}`.trim() })
  }

  const fieldClass = (hasError?: boolean) =>
    cn(
      'h-[42px] w-full rounded-2xl border-[1.5px] bg-white px-3 text-sm text-[#0D0D0F] outline-none transition-all',
      'placeholder:text-[#ADADB8]',
      'border-[rgba(13,13,15,0.14)] focus:border-[#0D0D0F] focus:shadow-[0_0_0_3px_rgba(13,13,15,0.06)]',
      hasError && 'border-[#E8334A] focus:border-[#E8334A]',
    )

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-[22px] font-semibold tracking-tight text-[#0D0D0F]">Tạo tài khoản</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#7A7A85]">
          Miễn phí · Không cần thẻ tín dụng · Bắt đầu học ngay
        </p>
      </div>

      {/* Google OAuth */}
      <a
        href="/auth/google"
        className="mb-5 flex h-11 w-full items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-[rgba(13,13,15,0.14)] bg-white text-sm font-medium text-[#3A3A40] transition-colors hover:bg-[#F2F2EF] hover:border-[#ADADB8]"
      >
        <GoogleIcon className="h-[18px] w-[18px] flex-shrink-0" />
        Đăng ký bằng Google
      </a>

      {/* Divider */}
      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[rgba(13,13,15,0.14)]" />
        <span className="whitespace-nowrap text-[11px] font-medium text-[#ADADB8]">hoặc đăng ký bằng email</span>
        <div className="h-px flex-1 bg-[rgba(13,13,15,0.14)]" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Họ + Tên */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-medium text-[#3A3A40]" htmlFor="reg-firstname">
              Họ
            </label>
            <input
              id="reg-firstname"
              type="text"
              autoComplete="given-name"
              placeholder="Nguyễn"
              className={fieldClass(!!errors.firstName)}
              {...register('firstName')}
            />
            {errors.firstName && (
              <p className="text-[11px] text-[#E8334A]">{errors.firstName.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-medium text-[#3A3A40]" htmlFor="reg-lastname">
              Tên
            </label>
            <input
              id="reg-lastname"
              type="text"
              autoComplete="family-name"
              placeholder="An"
              className={fieldClass(!!errors.lastName)}
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="text-[11px] text-[#E8334A]">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="block text-xs font-medium text-[#3A3A40]" htmlFor="reg-email">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="ten@example.com"
            className={fieldClass(!!errors.email)}
            {...register('email')}
          />
          {errors.email && <p className="text-[11px] text-[#E8334A]">{errors.email.message}</p>}
        </div>

        {/* Password + strength */}
        <div className="flex flex-col gap-1">
          <label className="block text-xs font-medium text-[#3A3A40]" htmlFor="reg-pw">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id="reg-pw"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Tối thiểu 8 ký tự"
              className={cn(fieldClass(!!errors.password), 'pr-10')}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ADADB8] transition-colors hover:text-[#3A3A40]"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <PasswordStrengthBar password={password} />
          {errors.password && (
            <p className="text-[11px] text-[#E8334A]">{errors.password.message}</p>
          )}
        </div>

        {/* Terms */}
        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="agree-terms"
              className="mt-0.5 flex-shrink-0 cursor-pointer accent-[#0D0D0F]"
              {...register('agreeTerms')}
            />
            <label htmlFor="agree-terms" className="cursor-pointer text-xs leading-relaxed text-[#7A7A85]">
              Tôi đồng ý với{' '}
              <a href="/terms" className="text-[#3A3A40] underline underline-offset-[3px]">
                Điều khoản dịch vụ
              </a>{' '}
              và{' '}
              <a href="/privacy" className="text-[#3A3A40] underline underline-offset-[3px]">
                Chính sách bảo mật
              </a>{' '}
              của Nihongo
            </label>
          </div>
          {errors.agreeTerms && (
            <p className="text-[11px] text-[#E8334A]">{errors.agreeTerms.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-1 h-[46px] w-full rounded-2xl bg-[#0D0D0F] text-[15px] font-semibold tracking-tight text-white transition-all hover:-translate-y-px hover:bg-[#2a2a30] hover:shadow-[0_4px_12px_rgba(13,13,15,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản →'}
        </button>
      </form>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-[#ADADB8]">
        Đã có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="cursor-pointer text-[#7A7A85] underline underline-offset-[3px]"
        >
          Đăng nhập
        </button>
      </p>
    </div>
  )
}
