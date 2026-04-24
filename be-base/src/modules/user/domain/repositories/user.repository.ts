import type { User } from '../entities/user.entity';

export interface FindAllUsersOptions {
  search?: string;
  role?: string;
  isActive?: boolean;
  sortBy?: 'email' | 'role' | 'createdAt' | 'isActive';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  createdAtFrom?: Date;
  createdAtTo?: Date;
}

export interface FindAllUsersResult {
  data: User[];
  total: number;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(options?: FindAllUsersOptions): Promise<FindAllUsersResult>;
  save(user: User): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
