import { Injectable } from '@nestjs/common';
import type {
  IAdminRepository,
  FindAllOptions,
  FindAllResult,
} from '../../domain/repositories/admin.repository';
import type { Admin } from '../../domain/entities/admin.entity';
import { AdminMapper, type AdminRecord } from '../mappers/admin.mapper';

@Injectable()
export class InMemoryAdminRepository implements IAdminRepository {
  private readonly store = new Map<string, AdminRecord>();

  findByEmail(email: string): Promise<Admin | null> {
    for (const record of this.store.values()) {
      if (record.email === email) {
        return Promise.resolve(AdminMapper.toDomain(record));
      }
    }
    return Promise.resolve(null);
  }

  findById(id: string): Promise<Admin | null> {
    const record = this.store.get(id);
    return Promise.resolve(record ? AdminMapper.toDomain(record) : null);
  }

  findAll(options?: FindAllOptions): Promise<FindAllResult> {
    let results = [...this.store.values()];

    if (options?.isActive !== undefined) {
      results = results.filter((r) => r.isActive === options.isActive);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      results = results.filter(
        (r) =>
          r.email.toLowerCase().includes(q) || r.role.toLowerCase().includes(q),
      );
    }
    if (options?.role) {
      results = results.filter((r) => r.role === options.role);
    }

    const sortBy = (options?.sortBy ?? 'createdAt') as keyof AdminRecord;
    const sortDir = options?.sortDir ?? 'desc';
    results = [...results].sort((a, b) => {
      const cmp = String(a[sortBy] ?? '').localeCompare(
        String(b[sortBy] ?? ''),
        undefined,
        { numeric: true },
      );
      return sortDir === 'asc' ? cmp : -cmp;
    });

    const total = results.length;
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? (total || 1);
    const start = (page - 1) * pageSize;
    const data = results
      .slice(start, start + pageSize)
      .map((r) => AdminMapper.toDomain(r));

    return Promise.resolve({ data, total });
  }

  save(admin: Admin): Promise<void> {
    this.store.set(admin.id.value, AdminMapper.toRecord(admin));
    return Promise.resolve();
  }
}
