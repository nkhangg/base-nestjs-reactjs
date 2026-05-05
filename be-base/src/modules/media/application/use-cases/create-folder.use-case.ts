import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import { MediaFolder } from '../../domain/entities/media-folder.entity';
import {
  MEDIA_FOLDER_REPOSITORY,
  type IMediaFolderRepository,
} from '../../domain/repositories/media-folder.repository';

export interface CreateFolderInput {
  name: string;
  parentId?: string;
  createdBy?: string;
}

@Injectable()
export class CreateFolderUseCase {
  constructor(
    @Inject(MEDIA_FOLDER_REPOSITORY)
    private readonly folderRepo: IMediaFolderRepository,
  ) {}

  async execute(
    input: CreateFolderInput,
  ): Promise<Result<{ folderId: string }, string>> {
    if (input.parentId) {
      const parent = await this.folderRepo.findById(input.parentId);
      if (!parent) return { ok: false, error: 'PARENT_FOLDER_NOT_FOUND' };
    }

    const folder = MediaFolder.create({
      name: input.name,
      parentId: input.parentId,
      createdBy: input.createdBy,
    });

    await this.folderRepo.save(folder);
    return { ok: true, value: { folderId: folder.id.value } };
  }
}
