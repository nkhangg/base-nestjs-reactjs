import { User } from '../../domain/entities/user.entity';

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
  xpTotal: number;
  streakCount: number;
  settings: unknown;
  createdAt: Date;
}

export class UserMapper {
  static toDomain(r: UserRecord): User {
    return User.reconstitute(r.id, {
      email: r.email,
      passwordHash: r.passwordHash,
      firstName: r.firstName,
      lastName: r.lastName,
      phone: r.phone,
      avatarUrl: r.avatarUrl,
      role: r.role,
      isActive: r.isActive,
      xpTotal: r.xpTotal ?? 0,
      streakCount: r.streakCount ?? 0,
      settings: (r.settings as Record<string, unknown>) ?? {},
      createdAt: r.createdAt,
    });
  }
}
