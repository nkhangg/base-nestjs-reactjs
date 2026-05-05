import type { MediaFile, MediaScope } from '../entities/media-file.entity';

export interface FindAllMediaFilesOptions {
  folderId?: string | null;
  scope?: MediaScope;
  mimeType?: string;
  tags?: string[];
  search?: string;
  sortBy?: 'filename' | 'size' | 'createdAt' | 'updatedAt';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface FindAllMediaFilesResult {
  data: MediaFile[];
  total: number;
}

export interface IMediaFileRepository {
  findById(id: string): Promise<MediaFile | null>;
  findByKey(key: string): Promise<MediaFile | null>;
  findAll(options?: FindAllMediaFilesOptions): Promise<FindAllMediaFilesResult>;
  save(file: MediaFile): Promise<void>;
  delete(id: string): Promise<void>;
}

export const MEDIA_FILE_REPOSITORY = Symbol('MEDIA_FILE_REPOSITORY');
