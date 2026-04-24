import { Module, OnModuleInit } from '@nestjs/common';
import type { ClassProvider, ValueProvider } from '@nestjs/common';
import { AuthorizationService, type SeedRoleDefinition } from '../../core/authorization';
import { ADMIN_FEATURE } from '../../core/admin-shell/admin.interface';
import { CONFIG_REPOSITORY } from './domain/repositories/config.repository';
import { PrismaConfigRepository } from './infrastructure/repositories/prisma-config.repository';
import { ConfigCacheService } from './application/services/config-cache.service';
import { CreateConfigUseCase } from './application/use-cases/create-config.use-case';
import { GetConfigByIdUseCase } from './application/use-cases/get-config-by-id.use-case';
import { GetConfigByKeyUseCase } from './application/use-cases/get-config-by-key.use-case';
import { GetConfigsBatchUseCase } from './application/use-cases/get-configs-batch.use-case';
import { ListConfigsUseCase } from './application/use-cases/list-configs.use-case';
import { UpdateConfigUseCase } from './application/use-cases/update-config.use-case';
import { ToggleConfigUseCase } from './application/use-cases/toggle-config.use-case';
import { DeleteConfigUseCase } from './application/use-cases/delete-config.use-case';
import { ConfigAdminController } from './presentation/admin/config-admin.controller';
import { ConfigAdminFeature } from './presentation/admin/config-admin.feature';
import { ConfigPublicController } from './presentation/public/config-public.controller';
import { ConfigAuthController } from './presentation/authenticated/config-auth.controller';

const CONFIG_ROLES: SeedRoleDefinition[] = [
  {
    name: 'admin',
    subjectType: 'admin',
    description: 'Admin — quyền quản lý config',
    permissions: {
      'config-management': ['read', 'create', 'update', 'delete'],
    },
  },
  {
    name: 'viewer',
    subjectType: 'admin',
    description: 'Viewer — chỉ đọc config',
    permissions: {
      'config-management': ['read'],
    },
  },
  {
    name: 'member',
    subjectType: 'user',
    description: 'User member — đọc config authenticated',
    permissions: {
      configs: ['read'],
    },
  },
  {
    name: 'staff',
    subjectType: 'merchant',
    description: 'Merchant staff — đọc config authenticated',
    permissions: {
      configs: ['read'],
    },
  },
];

@Module({
  controllers: [
    ConfigAdminController,
    ConfigPublicController,
    ConfigAuthController,
  ],
  providers: [
    {
      provide: CONFIG_REPOSITORY,
      useClass: PrismaConfigRepository,
    } as ClassProvider,
    {
      provide: ADMIN_FEATURE,
      useValue: ConfigAdminFeature,
      multi: true,
    } as ValueProvider,
    ConfigCacheService,
    CreateConfigUseCase,
    GetConfigByIdUseCase,
    GetConfigByKeyUseCase,
    GetConfigsBatchUseCase,
    ListConfigsUseCase,
    UpdateConfigUseCase,
    ToggleConfigUseCase,
    DeleteConfigUseCase,
  ],
  exports: [CONFIG_REPOSITORY, GetConfigByKeyUseCase, GetConfigsBatchUseCase],
})
export class ConfigModule implements OnModuleInit {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async onModuleInit(): Promise<void> {
    await this.authorizationService.seedRoles(CONFIG_ROLES);
  }
}
