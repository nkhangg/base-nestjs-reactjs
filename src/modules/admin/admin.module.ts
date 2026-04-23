import { Module, OnModuleInit } from '@nestjs/common';
import type { ClassProvider, ValueProvider } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from './domain/repositories/admin.repository';
import { PrismaAdminRepository } from './infrastructure/repositories/prisma-admin.repository';
import { AdminCredentialValidator } from './application/validators/admin-credential.validator';
import { CreateAdminUseCase } from './application/use-cases/create-admin.use-case';
import { GetAdminUseCase } from './application/use-cases/get-admin.use-case';
import { ListAdminsUseCase } from './application/use-cases/list-admins.use-case';
import { UpdateAdminRoleUseCase } from './application/use-cases/update-admin-role.use-case';
import { DeactivateAdminUseCase } from './application/use-cases/deactivate-admin.use-case';
import { ListAdminSessionsUseCase } from './application/use-cases/list-admin-sessions.use-case';
import { GetAdminAuthLogsUseCase } from './application/use-cases/get-admin-auth-logs.use-case';
import { RevokeAdminSessionUseCase } from './application/use-cases/revoke-admin-session.use-case';
import { ListRolesUseCase } from './application/use-cases/list-roles.use-case';
import { GetRoleUseCase } from './application/use-cases/get-role.use-case';
import { CreateRoleUseCase } from './application/use-cases/create-role.use-case';
import { UpdateRoleUseCase } from './application/use-cases/update-role.use-case';
import { DeleteRoleUseCase } from './application/use-cases/delete-role.use-case';
import { AdminSeeder } from './infrastructure/seeders/admin.seeder';
import { AdminManagementController } from './presentation/admin/admin-management.controller';
import { AdminSessionController } from './presentation/admin/admin-session.controller';
import { RoleManagementController } from './presentation/roles/role-management.controller';
import { AdminManagementFeature } from './presentation/admin/admin-management.feature';
import { RoleManagementFeature } from './presentation/roles/role-management.feature';
import { CREDENTIAL_VALIDATORS } from '../../core/auth/domain/services/credential-validator.interface';
import { ADMIN_FEATURE } from '../../core/admin-shell/admin.interface';
import {
  AuthorizationService,
  ALL_ACTIONS,
  type SeedRoleDefinition,
} from '../../core/authorization';

const ADMIN_ROLES: SeedRoleDefinition[] = [
  {
    name: 'super-admin',
    subjectType: 'admin',
    description: 'Toàn quyền hệ thống',
    permissions: { '*': ALL_ACTIONS },
  },
  {
    name: 'viewer',
    subjectType: 'admin',
    description: 'Chỉ xem',
    permissions: { '*': ['read'] },
  },
  {
    name: 'moderator',
    subjectType: 'admin',
    description: 'Xem, sửa và duyệt nội dung',
    parent: 'viewer',
    permissions: { '*': ['update', 'approve'] },
  },
  {
    name: 'editor',
    subjectType: 'admin',
    description: 'Tạo và chỉnh sửa nội dung',
    parent: 'viewer',
    permissions: { '*': ['create', 'update'] },
  },
  {
    name: 'admin',
    subjectType: 'admin',
    description: 'Quản trị viên — kế thừa editor, thêm quyền xóa',
    parent: 'editor',
    permissions: { '*': ['delete'] },
  },
];

@Module({
  controllers: [
    AdminManagementController,
    AdminSessionController,
    RoleManagementController,
  ],
  providers: [
    {
      provide: ADMIN_REPOSITORY,
      useClass: PrismaAdminRepository,
    } as ClassProvider,
    {
      provide: CREDENTIAL_VALIDATORS,
      useClass: AdminCredentialValidator,
      multi: true,
    } as ClassProvider,
    {
      provide: ADMIN_FEATURE,
      useValue: AdminManagementFeature,
      multi: true,
    } as ValueProvider,
    {
      provide: ADMIN_FEATURE,
      useValue: RoleManagementFeature,
      multi: true,
    } as ValueProvider,
    CreateAdminUseCase,
    GetAdminUseCase,
    ListAdminsUseCase,
    UpdateAdminRoleUseCase,
    DeactivateAdminUseCase,
    ListAdminSessionsUseCase,
    GetAdminAuthLogsUseCase,
    RevokeAdminSessionUseCase,
    ListRolesUseCase,
    GetRoleUseCase,
    CreateRoleUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    AdminSeeder,
  ],
  exports: [CREDENTIAL_VALIDATORS, CreateAdminUseCase],
})
export class AdminModule implements OnModuleInit {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async onModuleInit(): Promise<void> {
    // 1. Seed role definitions (idempotent)
    await this.authorizationService.seedRoles(ADMIN_ROLES);

    // 2. Migrate ALL admins: no pagination so every account gets a role assignment
    const { data: admins } = await this.adminRepo.findAll({
      pageSize: 100_000,
    });
    await Promise.all(
      admins.map((admin) =>
        this.authorizationService.assignRoleWithFallback(
          admin.id.value,
          'admin',
          admin.role,
        ),
      ),
    );
  }
}
