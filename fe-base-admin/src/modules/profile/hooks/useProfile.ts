import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { profileService } from '../services/profile.service'
import type { UpdateProfileDto } from '../types'

export function useProfile() {
  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: profileService.getProfile,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateProfileDto) => profileService.updateProfile(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['auth', 'profile'] })
      toast.success('Cập nhật thông tin thành công')
    },
    onError: () => {
      toast.error('Cập nhật thất bại, vui lòng thử lại')
    },
  })
}

export function useSessions() {
  return useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: profileService.getSessions,
    staleTime: 30 * 1000,
  })
}

export function useRevokeSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => profileService.revokeSession(sessionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['auth', 'sessions'] })
      toast.success('Đã thu hồi phiên đăng nhập')
    },
    onError: () => {
      toast.error('Không thể thu hồi phiên này')
    },
  })
}
