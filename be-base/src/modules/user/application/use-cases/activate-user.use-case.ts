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
import { UserActivatedEvent } from '../../domain/events/user-activated.event';

export interface ActivateUserInput {
  userId: string;
}

export type ActivateUserResult = Result<void, string>;

@Injectable()
export class ActivateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly authorizationService: AuthorizationService,
    @Inject(DOMAIN_EVENT_BUS) private readonly eventBus: IDomainEventBus,
  ) {}

  async execute(input: ActivateUserInput): Promise<ActivateUserResult> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) return { ok: false, error: 'USER_NOT_FOUND' };
    if (user.isActive) return { ok: false, error: 'USER_ALREADY_ACTIVE' };

    user.activate();
    await this.userRepo.save(user);

    await this.authorizationService.assignRoleWithFallback(
      input.userId,
      'user',
      user.role,
      'member',
    );

    this.eventBus.publish(new UserActivatedEvent(input.userId));

    return { ok: true, value: undefined };
  }
}
