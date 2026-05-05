import { User } from '../../domain/entities/user.entity';

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

export class UserMapper {
  static toDomain(r: UserRecord): User {
    return User.reconstitute(r.id, {
      email: r.email,
      passwordHash: r.passwordHash,
      name: r.name,
      phone: r.phone,
      avatarUrl: r.avatarUrl,
      role: r.role,
      isActive: r.isActive,
      createdAt: r.createdAt,
    });
  }
}
