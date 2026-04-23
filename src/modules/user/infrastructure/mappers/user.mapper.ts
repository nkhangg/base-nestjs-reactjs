import { User } from '../../domain/entities/user.entity';

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

export class UserMapper {
  static toDomain(r: UserRecord): User {
    return User.reconstitute(r.id, {
      email: r.email,
      passwordHash: r.passwordHash,
      role: r.role,
      isActive: r.isActive,
      createdAt: r.createdAt,
    });
  }
}
