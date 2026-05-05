import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '../services/auth.service'
import type { ChangePasswordDto, ForgotPasswordDto, LoginDto, ResetPasswordDto } from '../types'
import { ROUTES } from '@config/routes'

export const AUTH_QUERY_KEY = ['auth', 'me'] as const

export function useCurrentUser() {
  const { data, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authService.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
  return { user: data ?? null, isLoading }
}

export function useLogin() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const login = async (dto: LoginDto) => {
    await authService.login(dto)
    await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
    navigate(ROUTES.DASHBOARD)
  }

  return { login }
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const logout = async () => {
    await authService.logout()
    queryClient.clear()
    navigate(ROUTES.LOGIN)
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
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (dto: ResetPasswordDto) => authService.resetPassword(dto),
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công, vui lòng đăng nhập lại')
      navigate(ROUTES.LOGIN)
    },
    onError: () => toast.error('Token không hợp lệ hoặc đã hết hạn'),
  })
}
