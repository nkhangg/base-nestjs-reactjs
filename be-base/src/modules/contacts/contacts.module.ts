import { randomUUID } from 'crypto';
import { Module, OnModuleInit } from '@nestjs/common';
import type { ClassProvider, ValueProvider } from '@nestjs/common';
import { AuthorizationService, type SeedRoleDefinition } from '../../core/authorization';
import { ADMIN_FEATURE } from '../../core/admin-shell/admin.interface';
import { EventsModule } from '../../core/events';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { CONTACT_REPOSITORY } from './domain/repositories/contact.repository';
import { PrismaContactRepository } from './infrastructure/repositories/prisma-contact.repository';
import { SubmitContactUseCase } from './application/use-cases/submit-contact.use-case';
import { ListContactsUseCase } from './application/use-cases/list-contacts.use-case';
import { GetContactUseCase } from './application/use-cases/get-contact.use-case';
import { UpdateContactStatusUseCase } from './application/use-cases/update-contact-status.use-case';
import { ReplyToContactUseCase } from './application/use-cases/reply-to-contact.use-case';
import { DeleteContactUseCase } from './application/use-cases/delete-contact.use-case';
import { ContactsAdminController } from './presentation/admin/contacts-admin.controller';
import { ContactsAdminFeature } from './presentation/admin/contacts-admin.feature';
import { ContactsPublicController } from './presentation/public/contacts-public.controller';

const CONTACT_ROLES: SeedRoleDefinition[] = [
  {
    name: 'contact-manager',
    subjectType: 'admin',
    description: 'Quản lý liên hệ — read, update, delete',
    permissions: {
      contacts: ['read', 'update', 'delete'],
    },
  },
  {
    name: 'contact-viewer',
    subjectType: 'admin',
    description: 'Xem liên hệ — read only',
    permissions: {
      contacts: ['read'],
    },
  },
];

@Module({
  imports: [EventsModule],
  controllers: [ContactsAdminController, ContactsPublicController],
  providers: [
    {
      provide: CONTACT_REPOSITORY,
      useClass: PrismaContactRepository,
    } as ClassProvider,
    {
      provide: ADMIN_FEATURE,
      useValue: ContactsAdminFeature,
      multi: true,
    } as ValueProvider,
    SubmitContactUseCase,
    ListContactsUseCase,
    GetContactUseCase,
    UpdateContactStatusUseCase,
    ReplyToContactUseCase,
    DeleteContactUseCase,
  ],
})
export class ContactsModule implements OnModuleInit {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.authorizationService.seedRoles(CONTACT_ROLES);
    await this.prisma.appConfig.upsert({
      where: { key: 'system.mails' },
      create: {
        id: randomUUID(),
        key: 'system.mails',
        value: [],
        isEnabled: true,
        description: 'Admin emails nhận thông báo khi có liên hệ mới',
      },
      update: {},
    });
  }
}
