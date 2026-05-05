import { Global, Module } from '@nestjs/common';
import type { ClassProvider, FactoryProvider } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { ROLE_REPOSITORY } from './domain/repositories/role.repository';
import { PERMISSION_REPOSITORY } from './domain/repositories/permission.repository';
import { ROLE_ASSIGNMENT_REPOSITORY } from './domain/repositories/role-assignment.repository';
import { PrismaRoleRepository } from './infrastructure/repositories/prisma-role.repository';
import { PrismaPermissionRepository } from './infrastructure/repositories/prisma-permission.repository';
import { PrismaRoleAssignmentRepository } from './infrastructure/repositories/prisma-role-assignment.repository';
import {
  PERMISSION_CACHE,
  InMemoryPermissionCache,
  type IPermissionCache,
} from './infrastructure/cache/permission-cache';
import { RedisPermissionCache } from './infrastructure/cache/redis-permission-cache';
import { AuthorizationService } from './application/services/authorization.service';
import {
  PermissionGuard,
  UserPermissionGuard,
  MerchantPermissionGuard,
} from './infrastructure/permission.guard';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

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
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis | null => {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) return null;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Redis = require('ioredis') as typeof import('ioredis').default;
        return new Redis(redisUrl);
      },
    } as FactoryProvider,
    {
      provide: PERMISSION_CACHE,
      useFactory: (redisClient: Redis | null): IPermissionCache => {
        if (redisClient) return new RedisPermissionCache(redisClient);
        return new InMemoryPermissionCache();
      },
      inject: [REDIS_CLIENT],
    } as FactoryProvider,
    AuthorizationService,
    PermissionGuard,
    UserPermissionGuard,
    MerchantPermissionGuard,
  ],
  exports: [
    REDIS_CLIENT,
    AuthorizationService,
    PermissionGuard,
    UserPermissionGuard,
    MerchantPermissionGuard,
  ],
})
export class AuthorizationModule {}
