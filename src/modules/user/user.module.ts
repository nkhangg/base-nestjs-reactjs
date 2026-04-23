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
import { DeactivateUserUseCase } from './application/use-cases/deactivate-user.use-case';
import { UserManagementController } from './presentation/user/user-management.controller';
import { UserManagementFeature } from './presentation/user/user-management.feature';
import { ADMIN_FEATURE } from '../../core/admin-shell/admin.interface';
import {
  AuthorizationService,
  type SeedRoleDefinition,
} from '../../core/authorization';

const USER_ROLES: SeedRoleDefinition[] = [
  {
    name: 'member',
    subjectType: 'user',
    description: 'Người dùng đã đăng ký — quyền cơ bản',
    permissions: {
      profile: ['read', 'update'],
      orders: ['create', 'read'],
      reviews: ['create', 'read', 'update', 'delete'],
      wishlist: ['create', 'read', 'delete'],
      notifications: ['read', 'update'],
    },
  },
  {
    name: 'premium',
    subjectType: 'user',
    description:
      'Thành viên premium — kế thừa member, thêm quyền nội dung cao cấp',
    parent: 'member',
    permissions: {
      'premium-content': ['read'],
      subscriptions: ['read'],
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
    CreateUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    UpdateUserRoleUseCase,
    DeactivateUserUseCase,
  ],
  exports: [USER_REPOSITORY, CreateUserUseCase],
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
        ),
      ),
    );
  }
}
