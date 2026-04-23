import type { Role } from '../entities/role.entity';
import type { SubjectType } from '../value-objects/subject.vo';

export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findByName(name: string, subjectType: SubjectType): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  save(role: Role): Promise<void>;
  delete(id: string): Promise<void>;
}

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
