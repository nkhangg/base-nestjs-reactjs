import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../domain/repositories/admin.repository';
import { AuthorizationService } from '../../../../core/authorization';
import {
  DOMAIN_EVENT_BUS,
  type IDomainEventBus,
} from '../../../../core/events/domain/domain-event-bus.interface';
import { AdminRoleChangedEvent } from '../../domain/events/admin-role-changed.event';

export interface UpdateAdminRoleInput {
  adminId: string;
  role: string;
}

export type UpdateAdminRoleResult = Result<void, string>;

@Injectable()
export class UpdateAdminRoleUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    private readonly authorizationService: AuthorizationService,
    @Inject(DOMAIN_EVENT_BUS) private readonly eventBus: IDomainEventBus,
  ) {}

  async execute(input: UpdateAdminRoleInput): Promise<UpdateAdminRoleResult> {
    const admin = await this.adminRepo.findById(input.adminId);
    if (!admin) return { ok: false, error: 'ADMIN_NOT_FOUND' };
    if (!admin.isActive) return { ok: false, error: 'ADMIN_INACTIVE' };

    const currentRoles = await this.authorizationService.getAssignedRoleNames(
      input.adminId,
      'admin',
    );

    await Promise.all(
      currentRoles.map((r) =>
        this.authorizationService.revokeRole(input.adminId, 'admin', r),
      ),
    );
    await this.authorizationService.assignRoleWithFallback(
      input.adminId,
      'admin',
      input.role,
    );

    this.eventBus.publish(
      new AdminRoleChangedEvent(
        input.adminId,
        currentRoles[0] ?? '',
        input.role,
      ),
    );

    return { ok: true, value: undefined };
  }
}
