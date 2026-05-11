'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@shared/utils'
import { useLogin } from '../hooks/useAuth'
import { useGoogleLogin } from '../hooks/useGoogleLogin'
import { GoogleIcon } from './GoogleIcon'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onForgotPassword: () => void
  onSwitchToRegister: () => void
}

export function LoginForm({ onForgotPassword, onSwitchToRegister }: Props) {
  const { login } = useLogin()
  const { login: googleLogin, isReady: googleReady, isLoading: googleLoading } = useGoogleLogin()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      await login(values)
    } catch {
      setError('Email hoặc mật khẩu không đúng')
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-[22px] font-semibold tracking-tight text-[#0D0D0F]">Chào mừng trở lại</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#7A7A85]">
          Tiếp tục hành trình học tiếng Nhật của bạn
        </p>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={googleLogin}
        disabled={!googleReady || googleLoading}
        className="mb-5 flex h-11 w-full items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-[rgba(13,13,15,0.14)] bg-white text-sm font-medium text-[#3A3A40] transition-colors hover:bg-[#F2F2EF] hover:border-[#ADADB8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon className="h-[18px] w-[18px] flex-shrink-0" />
        {googleLoading ? 'Đang kết nối Google...' : 'Tiếp tục với Google'}
      </button>

      {/* Divider */}
      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[rgba(13,13,15,0.14)]" />
        <span className="whitespace-nowrap text-[11px] font-medium text-[#ADADB8]">hoặc đăng nhập bằng email</span>
        <div className="h-px flex-1 bg-[rgba(13,13,15,0.14)]" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="block text-xs font-medium text-[#3A3A40]" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
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

        {/* Password */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-[#3A3A40]" htmlFor="login-pw">
              Mật khẩu
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-[#7A7A85] underline underline-offset-[3px] transition-colors hover:text-[#0D0D0F]"
            >
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative">
            <input
              id="login-pw"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn(
                'h-[42px] w-full rounded-2xl border-[1.5px] bg-white px-3 pr-10 text-sm text-[#0D0D0F] outline-none transition-all',
                'placeholder:text-[#ADADB8]',
                'border-[rgba(13,13,15,0.14)] focus:border-[#0D0D0F] focus:shadow-[0_0_0_3px_rgba(13,13,15,0.06)]',
                errors.password && 'border-[#E8334A] focus:border-[#E8334A]',
              )}
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
          {errors.password && <p className="text-[11px] text-[#E8334A]">{errors.password.message}</p>}
        </div>

        {error && (
          <p className="rounded-lg border-l-[3px] border-[#E8334A] bg-[#FFF0F2] px-3 py-2 text-[13px] text-[#E8334A]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 h-[46px] w-full rounded-2xl bg-[#0D0D0F] text-[15px] font-semibold tracking-tight text-white transition-all hover:-translate-y-px hover:bg-[#2a2a30] hover:shadow-[0_4px_12px_rgba(13,13,15,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập →'}
        </button>
      </form>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-[#ADADB8]">
        Chưa có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="cursor-pointer text-[#7A7A85] underline underline-offset-[3px]"
        >
          Đăng ký miễn phí
        </button>
      </p>
    </div>
  )
}
