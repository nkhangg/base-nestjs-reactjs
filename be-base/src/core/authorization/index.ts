export { AuthorizationModule } from './authorization.module';
export { AuthorizationService } from './application/services/authorization.service';
export type { SeedRoleDefinition } from './application/services/authorization.service';
export { Subject } from './domain/value-objects/subject.vo';
export type { SubjectType } from './domain/value-objects/subject.vo';
export type { Action } from './domain/value-objects/action.vo';
export { ALL_ACTIONS } from './domain/value-objects/action.vo';
export {
  ROLE_REPOSITORY,
  type RoleRepository,
} from './domain/repositories/role.repository';
export {
  PERMISSION_REPOSITORY,
  type PermissionRepository,
} from './domain/repositories/permission.repository';
export {
  ROLE_ASSIGNMENT_REPOSITORY,
  type RoleAssignmentRepository,
} from './domain/repositories/role-assignment.repository';
export type { Role } from './domain/entities/role.entity';
export type { Permission as PermissionEntity } from './domain/entities/permission.entity';
export type { RoleAssignment } from './domain/entities/role-assignment.entity';
export {
  PermissionGuard,
  UserPermissionGuard,
  MerchantPermissionGuard,
} from './infrastructure/permission.guard';
export {
  Permission,
  PERMISSION_KEY,
  type PermissionMetadata,
} from './decorators/permission.decorator';
