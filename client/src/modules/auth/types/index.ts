export interface LoginDto {
  email: string
  password: string
  deviceName?: string
}

export interface OAuthLoginDto {
  provider: 'google'
  accessToken: string
  type: 'user'
  deviceName?: string
}

export interface RegisterDto {
  email: string
  password: string
  firstName?: string
  lastName?: string
  name?: string
}

export interface CurrentUser {
  userId: string
  sessionId: string
  email: string
  name?: string
  avatarUrl?: string
  isAdmin?: boolean
  accessibleResources?: string[]
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export interface ForgotPasswordDto {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
}

export interface ResetPasswordDto {
  token: string
  newPassword: string
}
