import type { Admin } from '../entities/admin.entity';

export interface FindAllOptions {
  search?: string;
  role?: string;
  isActive?: boolean;
  sortBy?: 'email' | 'role' | 'createdAt' | 'isActive';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface FindAllResult {
  data: Admin[];
  total: number;
}

export interface IAdminRepository {
  findByEmail(email: string): Promise<Admin | null>;
  findById(id: string): Promise<Admin | null>;
  findAll(options?: FindAllOptions): Promise<FindAllResult>;
  save(admin: Admin): Promise<void>;
}

export const ADMIN_REPOSITORY = Symbol('ADMIN_REPOSITORY');
