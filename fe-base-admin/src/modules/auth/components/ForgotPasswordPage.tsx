import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { cn } from '@shared/utils'
import { useForgotPassword } from '../hooks/useAuth'
import { ROUTES } from '@config/routes'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const { mutateAsync, isPending } = useForgotPassword()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      await mutateAsync({ email: values.email, type: 'admin' })
      setSubmitted(true)
    } catch {
      setError('Đã có lỗi xảy ra, vui lòng thử lại')
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-black px-4">
        <div className="w-full max-w-sm rounded-2xl bg-zinc-900 p-8 shadow-xl">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="size-6 text-green-400" />
            </div>
            <h1 className="text-lg font-semibold text-white">Kiểm tra email</h1>
            <p className="text-sm text-zinc-400">
              Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.
            </p>
          </div>

          <Link
            to={ROUTES.RESET_PASSWORD}
            className="block w-full rounded-lg bg-white py-2.5 text-center text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Đặt lại mật khẩu
          </Link>
          <Link
            to={ROUTES.LOGIN}
            className="mt-3 block text-center text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 p-8 shadow-xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white">Quên mật khẩu</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Nhập email tài khoản để nhận hướng dẫn đặt lại mật khẩu
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              className={cn(
                'h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-white',
                'placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500',
                errors.email && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              )}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
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
            {isPending ? 'Đang xử lý...' : 'Gửi yêu cầu'}
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
