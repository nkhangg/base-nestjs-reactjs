import { Inject, Injectable } from '@nestjs/common';
import type {
  MediaFile,
  MediaScope,
} from '../../domain/entities/media-file.entity';
import {
  MEDIA_FILE_REPOSITORY,
  type IMediaFileRepository,
} from '../../domain/repositories/media-file.repository';

export interface ListFilesInput {
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

@Injectable()
export class ListFilesUseCase {
  constructor(
    @Inject(MEDIA_FILE_REPOSITORY)
    private readonly fileRepo: IMediaFileRepository,
  ) {}

  async execute(
    input: ListFilesInput = {},
  ): Promise<{ data: MediaFile[]; total: number }> {
    return this.fileRepo.findAll(input);
  }
}
