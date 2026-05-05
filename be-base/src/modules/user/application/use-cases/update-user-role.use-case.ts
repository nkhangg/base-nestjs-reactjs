import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository';
import { AuthorizationService } from '../../../../core/authorization';
import {
  DOMAIN_EVENT_BUS,
  type IDomainEventBus,
} from '../../../../core/events/domain/domain-event-bus.interface';
import { UserRoleChangedEvent } from '../../domain/events/user-role-changed.event';

export interface UpdateUserRoleInput {
  userId: string;
  role: string;
}

export type UpdateUserRoleResult = Result<void, string>;

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly authorizationService: AuthorizationService,
    @Inject(DOMAIN_EVENT_BUS) private readonly eventBus: IDomainEventBus,
  ) {}

  async execute(input: UpdateUserRoleInput): Promise<UpdateUserRoleResult> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) return { ok: false, error: 'USER_NOT_FOUND' };
    if (!user.isActive) return { ok: false, error: 'USER_INACTIVE' };

    const oldRole = user.role;
    user.updateRole(input.role);
    await this.userRepo.save(user);

    await this.authorizationService.revokeRole(input.userId, 'user', oldRole);
    await this.authorizationService.assignRoleWithFallback(
      input.userId,
      'user',
      input.role,
      'member',
    );

    this.eventBus.publish(
      new UserRoleChangedEvent(input.userId, oldRole, input.role),
    );

    return { ok: true, value: undefined };
  }
}
