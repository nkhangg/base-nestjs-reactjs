import { Inject, Injectable } from '@nestjs/common';
import type { IAuthIdentity } from '../../../../core/auth/domain/services/auth-identity.interface';
import type { IOAuthUserConnector } from '../../../../core/auth/domain/services/oauth-user-connector.interface';
import type { OAuthUserInfo } from '../../../../core/auth/domain/services/oauth-identity-provider.interface';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { USER_ROLE_NAMES } from '../../domain/role-names';
import { AuthorizationService } from '../../../../core/authorization';
import {
  DOMAIN_EVENT_BUS,
  type IDomainEventBus,
} from '../../../../core/events/domain/domain-event-bus.interface';
import { UserCreatedEvent } from '../../domain/events/user-created.event';

@Injectable()
export class UserOAuthConnector implements IOAuthUserConnector {
  readonly type = 'user';

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly authorizationService: AuthorizationService,
    @Inject(DOMAIN_EVENT_BUS) private readonly eventBus: IDomainEventBus,
  ) {}

  async findOrCreateFromOAuth(
    provider: string,
    info: OAuthUserInfo,
  ): Promise<IAuthIdentity> {
    // 1. Existing OAuth account link
    let user = await this.userRepo.findByOAuthProvider(
      provider,
      info.providerId,
    );
    if (user) {
      return { id: user.id.value, email: user.email, type: 'user' };
    }

    // 2. Existing email account — link the OAuth provider
    user = await this.userRepo.findByEmail(info.email);
    if (user) {
      await this.userRepo.saveOAuthAccount(
        user.id.value,
        provider,
        info.providerId,
      );
      return { id: user.id.value, email: user.email, type: 'user' };
    }

    // 3. Create new user from OAuth
    const newUser = User.createFromOAuth({
      email: info.email,
      firstName: info.firstName,
      lastName: info.lastName,
      avatarUrl: info.avatarUrl,
      role: USER_ROLE_NAMES.MEMBER,
    });

    await this.userRepo.save(newUser);
    await this.authorizationService.assignRoleWithFallback(
      newUser.id.value,
      'user',
      USER_ROLE_NAMES.MEMBER,
      USER_ROLE_NAMES.MEMBER,
    );
    await this.userRepo.saveOAuthAccount(
      newUser.id.value,
      provider,
      info.providerId,
    );
    this.eventBus.publish(
      new UserCreatedEvent(
        newUser.id.value,
        newUser.email,
        USER_ROLE_NAMES.MEMBER,
      ),
    );

    return { id: newUser.id.value, email: newUser.email, type: 'user' };
  }
}
