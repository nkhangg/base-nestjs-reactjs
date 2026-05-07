'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authService } from '../services/auth.service'
import type { ChangePasswordDto, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from '../types'
import { ROUTES } from '@config/routes'
import { QUERY_KEYS } from '@shared/constants'

export function useCurrentUser() {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.AUTH.ME,
    queryFn: authService.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
  return { user: data ?? null, isLoading }
}

export function useLogin() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const login = async (dto: LoginDto) => {
    await authService.login(dto)
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.ME })
    router.push(ROUTES.DASHBOARD)
  }

  return { login }
}

export function useRegister() {
  const router = useRouter()

  return useMutation({
    mutationFn: (dto: RegisterDto) => authService.register(dto),
    onSuccess: () => {
      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.')
      router.push(ROUTES.VERIFY_EMAIL)
    },
    onError: () => toast.error('Email đã được sử dụng hoặc thông tin không hợp lệ'),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const logout = async () => {
    await authService.logout()
    queryClient.clear()
    router.push(ROUTES.LOGIN)
  }

  return { logout }
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (dto: ChangePasswordDto) => authService.changePassword(dto),
    onSuccess: () => toast.success('Đổi mật khẩu thành công'),
    onError: () => toast.error('Mật khẩu hiện tại không đúng'),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (dto: ForgotPasswordDto) => authService.forgotPassword(dto),
  })
}

export function useResetPassword() {
  const router = useRouter()
  return useMutation({
    mutationFn: (dto: ResetPasswordDto) => authService.resetPassword(dto),
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công, vui lòng đăng nhập lại')
      router.push(ROUTES.LOGIN)
    },
    onError: () => toast.error('Token không hợp lệ hoặc đã hết hạn'),
  })
}
