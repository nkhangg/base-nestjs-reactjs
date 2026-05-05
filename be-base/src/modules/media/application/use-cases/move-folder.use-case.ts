import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  MEDIA_FOLDER_REPOSITORY,
  type IMediaFolderRepository,
} from '../../domain/repositories/media-folder.repository';

@Injectable()
export class MoveFolderUseCase {
  constructor(
    @Inject(MEDIA_FOLDER_REPOSITORY)
    private readonly folderRepo: IMediaFolderRepository,
  ) {}

  async execute(
    id: string,
    parentId: string | null,
  ): Promise<Result<void, string>> {
    const folder = await this.folderRepo.findById(id);
    if (!folder) return { ok: false, error: 'FOLDER_NOT_FOUND' };

    if (parentId !== null) {
      const parent = await this.folderRepo.findById(parentId);
      if (!parent) return { ok: false, error: 'PARENT_FOLDER_NOT_FOUND' };
      // prevent circular reference
      if (parentId === id) return { ok: false, error: 'CIRCULAR_REFERENCE' };
    }

    folder.move(parentId);
    await this.folderRepo.save(folder);
    return { ok: true, value: undefined };
  }
}
