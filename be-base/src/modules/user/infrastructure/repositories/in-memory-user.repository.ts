import { Injectable } from '@nestjs/common';
import type {
  IUserRepository,
  FindAllUsersOptions,
  FindAllUsersResult,
} from '../../domain/repositories/user.repository';
import type { User } from '../../domain/entities/user.entity';

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(
    options: FindAllUsersOptions = {},
  ): Promise<FindAllUsersResult> {
    let data = [...this.store.values()];

    if (options.isActive !== undefined) {
      data = data.filter((u) => u.isActive === options.isActive);
    }
    if (options.role) {
      data = data.filter((u) => u.role === options.role);
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      data = data.filter((u) => u.email.toLowerCase().includes(q));
    }

    const total = data.length;
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    data = data.slice((page - 1) * pageSize, page * pageSize);

    return { data, total };
  }

  async save(user: User): Promise<void> {
    this.store.set(user.id.value, user);
  }
}
