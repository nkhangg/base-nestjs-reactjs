import { Module, OnModuleInit } from '@nestjs/common';
import type { ClassProvider, ValueProvider } from '@nestjs/common';
import {
  AuthorizationService,
  type SeedRoleDefinition,
} from '../../core/authorization';
import { ADMIN_FEATURE } from '../../core/admin-shell/admin.interface';
import { ADMIN_REPOSITORY } from '../admin/domain/repositories/admin.repository';
import { PrismaAdminRepository } from '../admin/infrastructure/repositories/prisma-admin.repository';
import { USER_REPOSITORY } from '../user/domain/repositories/user.repository';
import { PrismaUserRepository } from '../user/infrastructure/repositories/prisma-user.repository';
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository';
import { NOTIFICATION_RECIPIENT_REPOSITORY } from './domain/repositories/notification-recipient.repository';
import { NOTIFICATION_EMITTER } from './application/ports/notification-emitter.port';
import { PrismaNotificationRepository } from './infrastructure/repositories/prisma-notification.repository';
import { PrismaNotificationRecipientRepository } from './infrastructure/repositories/prisma-notification-recipient.repository';
import { NotificationGateway } from './infrastructure/gateways/notification.gateway';
import { NotificationTargetResolverService } from './application/services/notification-target-resolver.service';
import { SendNotificationUseCase } from './application/use-cases/send-notification.use-case';
import { ListMyNotificationsUseCase } from './application/use-cases/list-my-notifications.use-case';
import { GetUnreadCountUseCase } from './application/use-cases/get-unread-count.use-case';
import { MarkAsReadUseCase } from './application/use-cases/mark-as-read.use-case';
import { MarkAllAsReadUseCase } from './application/use-cases/mark-all-as-read.use-case';
import { DeleteNotificationUseCase } from './application/use-cases/delete-notification.use-case';
import { ListSentNotificationsUseCase } from './application/use-cases/list-sent-notifications.use-case';
import { GetSentNotificationDetailUseCase } from './application/use-cases/get-sent-notification-detail.use-case';
import { NotificationAdminController } from './presentation/admin/notification-admin.controller';
import { NotificationAdminFeature } from './presentation/admin/notification-admin.feature';
import { NotificationUserController } from './presentation/user/notification-user.controller';

const NOTIFICATION_ROLES: SeedRoleDefinition[] = [
  {
    name: 'notification-manager',
    subjectType: 'admin',
    description: 'Gửi và quản lý thông báo',
    permissions: {
      'notification-management': ['read', 'create', 'delete'],
    },
  },
];

@Module({
  controllers: [NotificationAdminController, NotificationUserController],
  providers: [
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    } as ClassProvider,
    {
      provide: NOTIFICATION_RECIPIENT_REPOSITORY,
      useClass: PrismaNotificationRecipientRepository,
    } as ClassProvider,
    {
      provide: ADMIN_REPOSITORY,
      useClass: PrismaAdminRepository,
    } as ClassProvider,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    } as ClassProvider,
    {
      provide: ADMIN_FEATURE,
      useValue: NotificationAdminFeature,
      multi: true,
    } as ValueProvider,
    NotificationGateway,
    { provide: NOTIFICATION_EMITTER, useExisting: NotificationGateway },
    NotificationTargetResolverService,
    SendNotificationUseCase,
    ListMyNotificationsUseCase,
    GetUnreadCountUseCase,
    MarkAsReadUseCase,
    MarkAllAsReadUseCase,
    DeleteNotificationUseCase,
    ListSentNotificationsUseCase,
    GetSentNotificationDetailUseCase,
  ],
  exports: [SendNotificationUseCase],
})
export class NotificationModule implements OnModuleInit {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async onModuleInit(): Promise<void> {
    await this.authorizationService.seedRoles(NOTIFICATION_ROLES);
  }
}
