import { Admin } from '../../domain/entities/admin.entity';

export interface AdminRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

export class AdminMapper {
  static toDomain(record: AdminRecord): Admin {
    return Admin.reconstitute(record.id, {
      email: record.email,
      passwordHash: record.passwordHash,
      role: record.role,
      isActive: record.isActive,
      createdAt: record.createdAt,
    });
  }

  static toRecord(admin: Admin): AdminRecord {
    return {
      id: admin.id.value,
      email: admin.email,
      passwordHash: admin.passwordHash,
      role: admin.role,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    };
  }
}
