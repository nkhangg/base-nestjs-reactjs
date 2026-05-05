import { Module, OnModuleInit } from '@nestjs/common';
import type {
  ClassProvider,
  FactoryProvider,
  ValueProvider,
} from '@nestjs/common';
import {
  AuthorizationService,
  type SeedRoleDefinition,
} from '../../core/authorization';
import { ADMIN_FEATURE } from '../../core/admin-shell/admin.interface';
import { STORAGE_PROVIDER } from './application/ports/storage.provider';
import { MEDIA_FILE_REPOSITORY } from './domain/repositories/media-file.repository';
import { MEDIA_FOLDER_REPOSITORY } from './domain/repositories/media-folder.repository';
import { LocalStorageProvider } from './infrastructure/storage/local-storage.provider';
import { MinioStorageProvider } from './infrastructure/storage/minio-storage.provider';
import { PrismaMediaFileRepository } from './infrastructure/repositories/prisma-media-file.repository';
import { PrismaMediaFolderRepository } from './infrastructure/repositories/prisma-media-folder.repository';
import { UploadFileUseCase } from './application/use-cases/upload-file.use-case';
import { ListFilesUseCase } from './application/use-cases/list-files.use-case';
import { GetFileUseCase } from './application/use-cases/get-file.use-case';
import { UpdateFileMetaUseCase } from './application/use-cases/update-file-meta.use-case';
import { DeleteFileUseCase } from './application/use-cases/delete-file.use-case';
import { GetSignedUrlUseCase } from './application/use-cases/get-signed-url.use-case';
import { ListFoldersUseCase } from './application/use-cases/list-folders.use-case';
import { CreateFolderUseCase } from './application/use-cases/create-folder.use-case';
import { RenameFolderUseCase } from './application/use-cases/rename-folder.use-case';
import { MoveFolderUseCase } from './application/use-cases/move-folder.use-case';
import { DeleteFolderUseCase } from './application/use-cases/delete-folder.use-case';
import { MediaAdminController } from './presentation/admin/media-admin.controller';
import { MediaAdminFeature } from './presentation/admin/media-admin.feature';
import { MediaPublicController } from './presentation/public/media-public.controller';
import type { IStorageProvider } from './application/ports/storage.provider';

// Use unique names so seedRoles does NOT overwrite the system-wide 'admin' / 'viewer'
// roles that carry wildcard '*' permissions. Those roles already cover media-management
// via the wildcard — we only need these for fine-grained, media-only roles.
const MEDIA_ROLES: SeedRoleDefinition[] = [
  {
    name: 'media-manager',
    subjectType: 'admin',
    description: 'Media Manager — full CRUD on media files and folders',
    permissions: {
      'media-management': ['read', 'create', 'update', 'delete'],
    },
  },
  {
    name: 'media-viewer',
    subjectType: 'admin',
    description: 'Media Viewer — read-only access to media library',
    permissions: {
      'media-management': ['read'],
    },
  },
];

@Module({
  controllers: [MediaAdminController, MediaPublicController],
  providers: [
    {
      provide: MEDIA_FILE_REPOSITORY,
      useClass: PrismaMediaFileRepository,
    } as ClassProvider,
    {
      provide: MEDIA_FOLDER_REPOSITORY,
      useClass: PrismaMediaFolderRepository,
    } as ClassProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (): IStorageProvider => {
        const type = process.env.STORAGE_TYPE ?? 'local';
        if (type === 'minio') return new MinioStorageProvider();
        return new LocalStorageProvider();
      },
    } as FactoryProvider,
    {
      provide: ADMIN_FEATURE,
      useValue: MediaAdminFeature,
      multi: true,
    } as ValueProvider,
    UploadFileUseCase,
    ListFilesUseCase,
    GetFileUseCase,
    UpdateFileMetaUseCase,
    DeleteFileUseCase,
    GetSignedUrlUseCase,
    ListFoldersUseCase,
    CreateFolderUseCase,
    RenameFolderUseCase,
    MoveFolderUseCase,
    DeleteFolderUseCase,
  ],
  exports: [GetFileUseCase, ListFilesUseCase],
})
export class MediaModule implements OnModuleInit {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async onModuleInit(): Promise<void> {
    await this.authorizationService.seedRoles(MEDIA_ROLES);
  }
}
