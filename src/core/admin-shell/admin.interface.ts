import { Type } from '@nestjs/common';

export const ADMIN_FEATURE = Symbol('ADMIN_FEATURE');

export type AdminPermission =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'publish'
  | 'approve'
  | 'export';

export interface AdminFeature {
  /**
   * Tên resource, dùng để build RBAC policy
   * @example 'products' | 'orders' | 'analytics'
   */
  resource: string;

  /**
   * NestJS controller xử lý các admin route của feature này
   */
  controller: Type<any>;

  /**
   * Permissions mà resource này expose ra
   * Shell dùng để seed default roles
   */
  permissions?: AdminPermission[];

  /**
   * Menu item hiển thị trong admin UI (optional)
   */
  menu?: {
    label: string;
    icon?: string;
    order?: number;
  };
}
