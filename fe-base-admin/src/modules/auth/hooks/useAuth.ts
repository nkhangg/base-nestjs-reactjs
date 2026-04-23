import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'
import type { LoginDto } from '../types'
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
