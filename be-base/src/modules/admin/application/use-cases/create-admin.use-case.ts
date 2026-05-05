import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import { Admin } from '../../domain/entities/admin.entity';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../domain/repositories/admin.repository';
import type { ITokenService } from '../../../../core/auth/domain/services/token.service';
import { TOKEN_SERVICE } from '../../../../core/auth/domain/services/token.service';
import { AuthorizationService } from '../../../../core/authorization';
import { ADMIN_ROLE_NAMES } from '../../domain/role-names';
import {
  DOMAIN_EVENT_BUS,
  type IDomainEventBus,
} from '../../../../core/events/domain/domain-event-bus.interface';
import { AdminCreatedEvent } from '../../domain/events/admin-created.event';

export interface CreateAdminInput {
  email: string;
  password: string;
  roles?: string[];
}

export type CreateAdminResult = Result<{ adminId: string }, string>;

@Injectable()
export class CreateAdminUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    private readonly authorizationService: AuthorizationService,
    @Inject(DOMAIN_EVENT_BUS) private readonly eventBus: IDomainEventBus,
  ) {}

  async execute(input: CreateAdminInput): Promise<CreateAdminResult> {
    const existing = await this.adminRepo.findByEmail(input.email);
    if (existing) {
      return { ok: false, error: 'EMAIL_ALREADY_EXISTS' };
    }

    const passwordHash = this.tokenService.hashToken(input.password);
    const admin = Admin.create({
      email: input.email,
      passwordHash,
    });

    await this.adminRepo.save(admin);

    const roles = input.roles?.length ? input.roles : [ADMIN_ROLE_NAMES.ADMIN];
    await Promise.all(
      roles.map((r) =>
        this.authorizationService.assignRoleWithFallback(
          admin.id.value,
          'admin',
          r,
        ),
      ),
    );

    this.eventBus.publish(
      new AdminCreatedEvent(admin.id.value, admin.email, roles[0]),
    );

    return { ok: true, value: { adminId: admin.id.value } };
  }
}
