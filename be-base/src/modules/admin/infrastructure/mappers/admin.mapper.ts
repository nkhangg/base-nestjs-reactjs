import { Admin } from '../../domain/entities/admin.entity';

export interface AdminRecord {
  id: string;
  email: string;
  passwordHash: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export class AdminMapper {
  static toDomain(record: AdminRecord): Admin {
    return Admin.reconstitute(record.id, {
      email: record.email,
      passwordHash: record.passwordHash,
      firstName: record.firstName,
      lastName: record.lastName,
      phone: record.phone,
      avatarUrl: record.avatarUrl,
      isActive: record.isActive,
      createdAt: record.createdAt,
    });
  }

  static toRecord(admin: Admin): AdminRecord {
    return {
      id: admin.id.value,
      email: admin.email,
      passwordHash: admin.passwordHash,
      firstName: admin.firstName,
      lastName: admin.lastName,
      phone: admin.phone,
      avatarUrl: admin.avatarUrl,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    };
  }
}
