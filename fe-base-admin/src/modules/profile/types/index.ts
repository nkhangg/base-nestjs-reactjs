export interface ProfileData {
  userId: string
  email: string
  isAdmin?: boolean
  role?: string
  name?: string | null
  phone?: string | null
  avatarUrl?: string | null
  createdAt?: string | null
  isActive?: boolean
}

export interface UpdateProfileDto {
  name?: string | null
  phone?: string | null
  avatarUrl?: string | null
}

export interface SessionItem {
  id: string
  deviceName: string
  ipAddress: string
  userAgent: string
  isActive: boolean
  lastActiveAt: string
  expiresAt: string
  createdAt: string
}
