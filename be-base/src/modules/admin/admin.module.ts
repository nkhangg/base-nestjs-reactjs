import { Module, OnModuleInit } from '@nestjs/common';
import type { ClassProvider, ValueProvider } from '@nestjs/common';
import { ADMIN_REPOSITORY } from './domain/repositories/admin.repository';
import { PrismaAdminRepository } from './infrastructure/repositories/prisma-admin.repository';
import { AdminCredentialValidator } from './application/validators/admin-credential.validator';
import { CreateAdminUseCase } from './application/use-cases/create-admin.use-case';
import { GetAdminUseCase } from './application/use-cases/get-admin.use-case';
import { ListAdminsUseCase } from './application/use-cases/list-admins.use-case';
import { UpdateAdminRoleUseCase } from './application/use-cases/update-admin-role.use-case';
import { SyncAdminRolesUseCase } from './application/use-cases/sync-admin-roles.use-case';
import { GetAdminRolesUseCase } from './application/use-cases/get-admin-roles.use-case';
import { DeactivateAdminUseCase } from './application/use-cases/deactivate-admin.use-case';
import { ActivateAdminUseCase } from './application/use-cases/activate-admin.use-case';
import { UpdateAdminInfoUseCase } from './application/use-cases/update-admin-info.use-case';
import { ResetAdminPasswordUseCase } from './application/use-cases/reset-admin-password.use-case';
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
import { PASSWORD_UPDATERS } from '../../core/auth/domain/services/password-updater.interface';
import { AdminPasswordUpdater } from './infrastructure/admin-password-updater';
import { PROFILE_PROVIDERS } from '../../core/auth/domain/services/profile-provider.interface';
import { AdminProfileProvider } from './infrastructure/admin-profile-provider';
import { ADMIN_FEATURE } from '../../core/admin-shell/admin.interface';
import {
  AuthorizationService,
  ALL_ACTIONS,
  type SeedRoleDefinition,
} from '../../core/authorization';

const ADMIN_ROLES: SeedRoleDefinition[] = [
  {
    name: 'base',
    subjectType: 'admin',
    description: 'Quyền cơ bản — đọc thông báo',
    permissions: {
      notifications: ['read'],
      'system-notifications': ['read'],
    },
  },
  {
    name: 'super-admin',
    subjectType: 'admin',
    description: 'Toàn quyền hệ thống',
    parent: 'base',
    permissions: { '*': ALL_ACTIONS },
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
      provide: PASSWORD_UPDATERS,
      useClass: AdminPasswordUpdater,
      multi: true,
    } as ClassProvider,
    AdminPasswordUpdater,
    {
      provide: PROFILE_PROVIDERS,
      useClass: AdminProfileProvider,
      multi: true,
    } as ClassProvider,
    AdminProfileProvider,
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
    SyncAdminRolesUseCase,
    GetAdminRolesUseCase,
    DeactivateAdminUseCase,
    ActivateAdminUseCase,
    UpdateAdminInfoUseCase,
    ResetAdminPasswordUseCase,
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
  exports: [CREDENTIAL_VALIDATORS, PASSWORD_UPDATERS, PROFILE_PROVIDERS, CreateAdminUseCase],
})
export class AdminModule implements OnModuleInit {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly adminSeeder: AdminSeeder,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.authorizationService.seedRoles(ADMIN_ROLES);
    await this.authorizationService.deleteObsoleteRoles(
      ['system-notification-receiver'],
      'admin',
    );
    await this.adminSeeder.seed();
  }
}
