import type { RoleAssignment } from '../entities/role-assignment.entity';
import type { SubjectType } from '../value-objects/subject.vo';

export interface RoleAssignmentRepository {
  findBySubject(
    subjectId: string,
    subjectType: SubjectType,
  ): Promise<RoleAssignment[]>;
  findByRoleId(roleId: string): Promise<RoleAssignment[]>;
  save(assignment: RoleAssignment): Promise<void>;
  delete(
    subjectId: string,
    subjectType: SubjectType,
    roleId: string,
  ): Promise<void>;
  deleteByRoleId(roleId: string): Promise<void>;
}

export const ROLE_ASSIGNMENT_REPOSITORY = Symbol('ROLE_ASSIGNMENT_REPOSITORY');
