import { Global, Module } from '@nestjs/common';
import type { ClassProvider } from '@nestjs/common';
import { ROLE_REPOSITORY } from './domain/repositories/role.repository';
import { PERMISSION_REPOSITORY } from './domain/repositories/permission.repository';
import { ROLE_ASSIGNMENT_REPOSITORY } from './domain/repositories/role-assignment.repository';
import { PrismaRoleRepository } from './infrastructure/repositories/prisma-role.repository';
import { PrismaPermissionRepository } from './infrastructure/repositories/prisma-permission.repository';
import { PrismaRoleAssignmentRepository } from './infrastructure/repositories/prisma-role-assignment.repository';
import { PermissionCache } from './infrastructure/cache/permission-cache';
import { AuthorizationService } from './application/services/authorization.service';
import {
  PermissionGuard,
  UserPermissionGuard,
  MerchantPermissionGuard,
} from './infrastructure/permission.guard';

@Global()
@Module({
  providers: [
    {
      provide: ROLE_REPOSITORY,
      useClass: PrismaRoleRepository,
    } as ClassProvider,
    {
      provide: PERMISSION_REPOSITORY,
      useClass: PrismaPermissionRepository,
    } as ClassProvider,
    {
      provide: ROLE_ASSIGNMENT_REPOSITORY,
      useClass: PrismaRoleAssignmentRepository,
    } as ClassProvider,
    PermissionCache,
    AuthorizationService,
    PermissionGuard,
    UserPermissionGuard,
    MerchantPermissionGuard,
  ],
  exports: [
    AuthorizationService,
    PermissionGuard,
    UserPermissionGuard,
    MerchantPermissionGuard,
  ],
})
export class AuthorizationModule {}
