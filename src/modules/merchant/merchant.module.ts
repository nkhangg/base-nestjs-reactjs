import { Module, OnModuleInit } from '@nestjs/common';
import {
  AuthorizationService,
  ALL_ACTIONS,
  type SeedRoleDefinition,
} from '../../core/authorization';

const MERCHANT_ROLES: SeedRoleDefinition[] = [
  {
    name: 'staff',
    subjectType: 'merchant',
    description: 'Nhân viên — xem và xử lý đơn hàng, cập nhật sản phẩm',
    permissions: {
      products: ['read', 'update'],
      orders: ['read', 'update'],
      customers: ['read'],
    },
  },
  {
    name: 'manager',
    subjectType: 'merchant',
    description:
      'Quản lý — kế thừa staff, thêm quyền tạo/xóa sản phẩm và xem phân tích',
    parent: 'staff',
    permissions: {
      products: ['create', 'delete'],
      analytics: ['read', 'export'],
      promotions: ['create', 'read', 'update', 'delete'],
    },
  },
  {
    name: 'owner',
    subjectType: 'merchant',
    description: 'Chủ shop — toàn quyền, kế thừa manager',
    parent: 'manager',
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
