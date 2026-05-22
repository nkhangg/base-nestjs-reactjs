import { Injectable, Inject } from '@nestjs/common';
import { AuthorizationService } from '../../../../core/authorization';
import type { Action } from '../../../../core/authorization/domain/value-objects/action.vo';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../../admin/domain/repositories/admin.repository';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../user/domain/repositories/user.repository';

export type NotificationTarget =
  | { kind: 'individual'; recipientId: string; recipientType: 'user' | 'admin' }
  | { kind: 'by-role'; roleName: string; subjectType: 'user' | 'admin' }
  | {
      kind: 'by-permission';
      resource: string;
      action: Action;
      subjectType: 'user' | 'admin';
    }
  | { kind: 'all-users' }
  | { kind: 'all-admins' }
  | { kind: 'broadcast' };

export interface ResolvedRecipient {
  recipientId: string;
  recipientType: 'user' | 'admin';
}

@Injectable()
export class NotificationTargetResolverService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async resolve(targets: NotificationTarget[]): Promise<ResolvedRecipient[]> {
    const seen = new Set<string>();
    const results: ResolvedRecipient[] = [];

    const add = (recipientId: string, recipientType: 'user' | 'admin') => {
      const key = `${recipientType}:${recipientId}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ recipientId, recipientType });
      }
    };

    for (const target of targets) {
      if (target.kind === 'individual') {
        add(target.recipientId, target.recipientType);
      } else if (target.kind === 'all-users') {
        const { data } = await this.userRepo.findAll({ pageSize: 1_000_000, isActive: true });
        data.forEach((u) => add(u.id.value, 'user'));
      } else if (target.kind === 'all-admins') {
        const { data } = await this.adminRepo.findAll({ pageSize: 1_000_000, isActive: true });
        data.forEach((a) => add(a.id.value, 'admin'));
      } else if (target.kind === 'broadcast') {
        const [users, admins] = await Promise.all([
          this.userRepo.findAll({ pageSize: 1_000_000, isActive: true }),
          this.adminRepo.findAll({ pageSize: 1_000_000, isActive: true }),
        ]);
        users.data.forEach((u) => add(u.id.value, 'user'));
        admins.data.forEach((a) => add(a.id.value, 'admin'));
      } else if (target.kind === 'by-role') {
        const ids = await this.authorizationService.findSubjectIdsByRole(
          target.roleName,
          target.subjectType,
        );
        ids.forEach((id) => add(id, target.subjectType));
      } else if (target.kind === 'by-permission') {
        const ids = await this.authorizationService.findSubjectIdsByPermission(
          target.resource,
          target.action,
          target.subjectType,
        );
        ids.forEach((id) => add(id, target.subjectType));
      }
    }

    return results;
  }
}
