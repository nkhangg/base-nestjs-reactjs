import { Module, OnModuleInit } from '@nestjs/common';
import {
  AuthorizationService,
  ALL_ACTIONS,
  type SeedRoleDefinition,
} from '../../core/authorization';

const MERCHANT_ROLES: SeedRoleDefinition[] = [
  {
    name: 'base',
    subjectType: 'merchant',
    description: 'Quyền cơ bản — đọc thông báo',
    permissions: {
      notifications: ['read'],
    },
  },
  {
    name: 'owner',
    subjectType: 'merchant',
    description: 'Chủ shop — toàn quyền',
    parent: 'base',
    permissions: {
      '*': ALL_ACTIONS,
    },
  },
];

@Module({})
export class MerchantModule implements OnModuleInit {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async onModuleInit(): Promise<void> {
    await this.authorizationService.seedRoles(MERCHANT_ROLES);
  }
}
