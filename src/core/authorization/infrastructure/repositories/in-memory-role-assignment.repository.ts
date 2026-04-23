import { Injectable } from '@nestjs/common';
import type { RoleAssignmentRepository } from '../../domain/repositories/role-assignment.repository';
import type { RoleAssignment } from '../../domain/entities/role-assignment.entity';
import type { SubjectType } from '../../domain/value-objects/subject.vo';

@Injectable()
export class InMemoryRoleAssignmentRepository implements RoleAssignmentRepository {
  private readonly store = new Map<string, RoleAssignment>();

  async findBySubject(
    subjectId: string,
    subjectType: SubjectType,
  ): Promise<RoleAssignment[]> {
    return [...this.store.values()].filter(
      (a) => a.subjectId === subjectId && a.subjectType === subjectType,
    );
  }

  async save(assignment: RoleAssignment): Promise<void> {
    this.store.set(assignment.id, assignment);
  }

  async findByRoleId(roleId: string): Promise<RoleAssignment[]> {
    return [...this.store.values()].filter((a) => a.roleId === roleId);
  }

  async delete(
    subjectId: string,
    subjectType: SubjectType,
    roleId: string,
  ): Promise<void> {
    for (const [id, a] of this.store.entries()) {
      if (
        a.subjectId === subjectId &&
        a.subjectType === subjectType &&
        a.roleId === roleId
      ) {
        this.store.delete(id);
        return;
      }
    }
  }

  async deleteByRoleId(roleId: string): Promise<void> {
    for (const [id, a] of Array.from(this.store.entries())) {
      if (a.roleId === roleId) this.store.delete(id);
    }
  }
}
