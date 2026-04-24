import type { AppConfig, ConfigScope } from '../entities/app-config.entity';

export interface FindAllConfigsOptions {
  scope?: ConfigScope;
  isEnabled?: boolean;
  tags?: string[];
  search?: string;
  sortBy?: 'key' | 'scope' | 'isEnabled' | 'createdAt' | 'updatedAt';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface FindAllConfigsResult {
  data: AppConfig[];
  total: number;
}

export interface IConfigRepository {
  findById(id: string): Promise<AppConfig | null>;
  findByKey(key: string): Promise<AppConfig | null>;
  findByKeys(keys: string[]): Promise<AppConfig[]>;
  findAll(options?: FindAllConfigsOptions): Promise<FindAllConfigsResult>;
  save(config: AppConfig): Promise<void>;
  delete(id: string): Promise<void>;
  existsByKey(key: string): Promise<boolean>;
}

export const CONFIG_REPOSITORY = Symbol('CONFIG_REPOSITORY');
