import { Injectable } from '@nestjs/common';
import type { RoleRepository } from '../../domain/repositories/role.repository';
import type { Role } from '../../domain/entities/role.entity';
import type { SubjectType } from '../../domain/value-objects/subject.vo';

@Injectable()
export class InMemoryRoleRepository implements RoleRepository {
  private readonly store = new Map<string, Role>();

  async findById(id: string): Promise<Role | null> {
    return this.store.get(id) ?? null;
  }

  async findByName(
    name: string,
    subjectType: SubjectType,
  ): Promise<Role | null> {
    for (const role of this.store.values()) {
      if (
        role.name === name &&
        (role.subjectType === subjectType || role.subjectType === '*')
      ) {
        return role;
      }
    }
    return null;
  }

  async findAll(): Promise<Role[]> {
    return [...this.store.values()];
  }

  async save(role: Role): Promise<void> {
    this.store.set(role.id, role);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
