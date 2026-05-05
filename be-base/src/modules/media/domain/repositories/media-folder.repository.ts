import type { MediaFolder } from '../entities/media-folder.entity';

export interface IMediaFolderRepository {
  findById(id: string): Promise<MediaFolder | null>;
  findByParentId(parentId: string | null): Promise<MediaFolder[]>;
  findAll(): Promise<MediaFolder[]>;
  hasChildren(id: string): Promise<boolean>;
  hasFiles(id: string): Promise<boolean>;
  save(folder: MediaFolder): Promise<void>;
  delete(id: string): Promise<void>;
}

export const MEDIA_FOLDER_REPOSITORY = Symbol('MEDIA_FOLDER_REPOSITORY');
