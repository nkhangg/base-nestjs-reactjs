export interface CreateUserDto {
  email: string
  password: string
  role?: string
}

export interface UpdateUserRoleDto {
  role: string
}

export interface UpdateUserInfoDto {
  email?: string
}

export interface User {
  id: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

export interface UserListParams {
  page?: number
  limit?: number
  sortBy?: string
  search?: string
  'filter.isActive'?: string
  'filter.role'?: string
  'filter.createdAt'?: string | string[]
}

export interface UserListMeta {
  totalItems: number
  currentPage: number
  itemsPerPage: number
  totalPages: number
}

export interface UserListResponse {
  data: User[]
  meta: UserListMeta
}
