import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository';
import {
  DOMAIN_EVENT_BUS,
  type IDomainEventBus,
} from '../../../../core/events/domain/domain-event-bus.interface';
import { UserEmailChangedEvent } from '../../domain/events/user-email-changed.event';

export interface UpdateUserInfoInput {
  userId: string;
  email?: string;
}

export type UpdateUserInfoResult = Result<void, string>;

@Injectable()
export class UpdateUserInfoUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(DOMAIN_EVENT_BUS) private readonly eventBus: IDomainEventBus,
  ) {}

  async execute(input: UpdateUserInfoInput): Promise<UpdateUserInfoResult> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) return { ok: false, error: 'USER_NOT_FOUND' };

    const oldEmail = user.email;
    if (input.email && input.email !== user.email) {
      const existing = await this.userRepo.findByEmail(input.email);
      if (existing) return { ok: false, error: 'EMAIL_ALREADY_EXISTS' };
      user.updateEmail(input.email);
    }

    await this.userRepo.save(user);

    if (input.email && input.email !== oldEmail) {
      this.eventBus.publish(
        new UserEmailChangedEvent(input.userId, oldEmail, input.email),
      );
    }

    return { ok: true, value: undefined };
  }
}
