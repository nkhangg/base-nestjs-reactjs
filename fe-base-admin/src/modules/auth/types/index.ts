export interface LoginDto {
  email: string
  password: string
  type: string
  deviceName?: string
}

export interface CurrentUser {
  userId: string
  sessionId: string
  email: string
  isAdmin?: boolean
  accessibleResources?: string[]
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export interface ForgotPasswordDto {
  email: string
  type: string
}

export interface ForgotPasswordResponse {
  message: string
  token?: string
}

export interface ResetPasswordDto {
  token: string
  newPassword: string
}
