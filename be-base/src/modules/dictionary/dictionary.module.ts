import { Module, OnModuleInit } from '@nestjs/common';
import type { ClassProvider, ValueProvider } from '@nestjs/common';
import {
  AuthorizationService,
  type SeedRoleDefinition,
} from '../../core/authorization';
import { ADMIN_FEATURE } from '../../core/admin-shell/admin.interface';
import { EventsModule } from '../../core/events';
import { DICTIONARY_REPOSITORY } from './domain/repositories/dictionary.repository';
import { PrismaDictionaryRepository } from './infrastructure/repositories/prisma-dictionary.repository';
import { CreateDictionaryEntryUseCase } from './application/use-cases/create-dictionary-entry.use-case';
import { UpdateDictionaryEntryUseCase } from './application/use-cases/update-dictionary-entry.use-case';
import { DeleteDictionaryEntryUseCase } from './application/use-cases/delete-dictionary-entry.use-case';
import { GetDictionaryEntryUseCase } from './application/use-cases/get-dictionary-entry.use-case';
import { SearchDictionaryUseCase } from './application/use-cases/search-dictionary.use-case';
import { ModerateDictionaryEntryUseCase } from './application/use-cases/moderate-dictionary-entry.use-case';
import { ListPendingEntriesUseCase } from './application/use-cases/list-pending-entries.use-case';
import { DictionaryAdminController } from './presentation/admin/dictionary-admin.controller';
import { DictionaryAdminFeature } from './presentation/admin/dictionary-admin.feature';
import { DictionaryPublicController } from './presentation/public/dictionary-public.controller';
import { DictionaryUserController } from './presentation/user/dictionary-user.controller';

const DICTIONARY_ROLES: SeedRoleDefinition[] = [
  {
    name: 'dictionary-editor',
    subjectType: 'admin',
    description: 'Full CRUD + moderate dictionary entries',
    permissions: {
      'dictionary-management': [
        'read',
        'create',
        'update',
        'delete',
        'approve',
      ],
    },
  },
  {
    name: 'dictionary-viewer',
    subjectType: 'admin',
    description: 'Read-only dictionary management',
    permissions: {
      'dictionary-management': ['read'],
    },
  },
];

@Module({
  imports: [EventsModule],
  controllers: [
    DictionaryAdminController,
    DictionaryPublicController,
    DictionaryUserController,
  ],
  providers: [
    {
      provide: DICTIONARY_REPOSITORY,
      useClass: PrismaDictionaryRepository,
    } as ClassProvider,
    {
      provide: ADMIN_FEATURE,
      useValue: DictionaryAdminFeature,
      multi: true,
    } as ValueProvider,
    CreateDictionaryEntryUseCase,
    UpdateDictionaryEntryUseCase,
    DeleteDictionaryEntryUseCase,
    GetDictionaryEntryUseCase,
    SearchDictionaryUseCase,
    ModerateDictionaryEntryUseCase,
    ListPendingEntriesUseCase,
  ],
})
export class DictionaryModule implements OnModuleInit {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async onModuleInit(): Promise<void> {
    await this.authorizationService.seedRoles(DICTIONARY_ROLES);
  }
}
