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
  adminRole?: string
}
