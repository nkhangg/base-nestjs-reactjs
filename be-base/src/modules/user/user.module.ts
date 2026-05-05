import { Module, OnModuleInit } from '@nestjs/common';
import type { ClassProvider, ValueProvider } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from './domain/repositories/user.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { GetUserUseCase } from './application/use-cases/get-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { UpdateUserRoleUseCase } from './application/use-cases/update-user-role.use-case';
import { UpdateUserInfoUseCase } from './application/use-cases/update-user-info.use-case';
import { DeactivateUserUseCase } from './application/use-cases/deactivate-user.use-case';
import { ActivateUserUseCase } from './application/use-cases/activate-user.use-case';
import { UserManagementController } from './presentation/user/user-management.controller';
import { UserManagementFeature } from './presentation/user/user-management.feature';
import { ADMIN_FEATURE } from '../../core/admin-shell/admin.interface';
import { PASSWORD_UPDATERS } from '../../core/auth/domain/services/password-updater.interface';
import { UserPasswordUpdater } from './infrastructure/user-password-updater';
import { PROFILE_PROVIDERS } from '../../core/auth/domain/services/profile-provider.interface';
import { UserProfileProvider } from './infrastructure/user-profile-provider';
import {
  AuthorizationService,
  type SeedRoleDefinition,
} from '../../core/authorization';
import { USER_ROLE_NAMES } from './domain/role-names';

const USER_ROLES: SeedRoleDefinition[] = [
  {
    name: USER_ROLE_NAMES.BASE,
    subjectType: 'user',
    description: 'Quyền cơ bản — đọc thông báo',
    permissions: {
      notifications: ['read'],
    },
  },
  {
    name: USER_ROLE_NAMES.MEMBER,
    subjectType: 'user',
    description: 'Người dùng đã đăng ký — quyền đầy đủ',
    parent: USER_ROLE_NAMES.BASE,
    permissions: {
      profile: ['read', 'update'],
      orders: ['create', 'read'],
      reviews: ['create', 'read', 'update', 'delete'],
      wishlist: ['create', 'read', 'delete'],
      notifications: ['read', 'update'],
    },
  },
];

@Module({
  controllers: [UserManagementController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    } as ClassProvider,
    {
      provide: ADMIN_FEATURE,
      useValue: UserManagementFeature,
      multi: true,
    } as ValueProvider,
    {
      provide: PASSWORD_UPDATERS,
      useClass: UserPasswordUpdater,
      multi: true,
    } as ClassProvider,
    UserPasswordUpdater,
    {
      provide: PROFILE_PROVIDERS,
      useClass: UserProfileProvider,
      multi: true,
    } as ClassProvider,
    UserProfileProvider,
    CreateUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    UpdateUserRoleUseCase,
    UpdateUserInfoUseCase,
    DeactivateUserUseCase,
    ActivateUserUseCase,
  ],
  exports: [
    USER_REPOSITORY,
    PASSWORD_UPDATERS,
    PROFILE_PROVIDERS,
    CreateUserUseCase,
  ],
})
export class UserModule implements OnModuleInit {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.authorizationService.seedRoles(USER_ROLES);

    const { data: users } = await this.userRepo.findAll({ pageSize: 100_000 });
    await Promise.all(
      users.map((user) =>
        this.authorizationService.assignRoleWithFallback(
          user.id.value,
          'user',
          user.role,
          USER_ROLE_NAMES.MEMBER,
        ),
      ),
    );
  }
}
