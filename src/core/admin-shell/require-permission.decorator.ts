import { SetMetadata } from '@nestjs/common';
import { AdminPermission } from './admin.interface';

export const ADMIN_PERMISSION_KEY = 'admin_permission';

export const RequirePermission = (
  resource: string,
  permission: AdminPermission,
) => SetMetadata(ADMIN_PERMISSION_KEY, { resource, permission });
