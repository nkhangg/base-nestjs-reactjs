import { Inject, Injectable } from '@nestjs/common';
import type { MediaFolder } from '../../domain/entities/media-folder.entity';
import {
  MEDIA_FOLDER_REPOSITORY,
  type IMediaFolderRepository,
} from '../../domain/repositories/media-folder.repository';

export interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderNode[];
  createdAt: Date;
}

function buildTree(
  folders: MediaFolder[],
  parentId: string | null = null,
): FolderNode[] {
  return folders
    .filter((f) => f.parentId === parentId)
    .map((f) => ({
      id: f.id.value,
      name: f.name,
      parentId: f.parentId,
      children: buildTree(folders, f.id.value),
      createdAt: f.createdAt,
    }));
}

@Injectable()
export class ListFoldersUseCase {
  constructor(
    @Inject(MEDIA_FOLDER_REPOSITORY)
    private readonly folderRepo: IMediaFolderRepository,
  ) {}

  async execute(): Promise<FolderNode[]> {
    const folders = await this.folderRepo.findAll();
    return buildTree(folders);
  }
}
