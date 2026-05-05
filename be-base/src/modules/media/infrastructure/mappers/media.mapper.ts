import type {
  MediaFile as PrismaMediaFile,
  MediaFolder as PrismaMediaFolder,
} from '@prisma/client';
import {
  MediaFile,
  type MediaScope,
} from '../../domain/entities/media-file.entity';
import { MediaFolder } from '../../domain/entities/media-folder.entity';

export class MediaMapper {
  static fileToDomail(row: PrismaMediaFile): MediaFile {
    return MediaFile.reconstitute(row.id, {
      key: row.key,
      filename: row.filename,
      mimeType: row.mimeType,
      size: row.size,
      width: row.width,
      height: row.height,
      url: row.url,
      thumbnailKey: row.thumbnailKey,
      thumbnailUrl: row.thumbnailUrl,
      alt: row.alt,
      scope: row.scope as MediaScope,
      folderId: row.folderId,
      tags: row.tags,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static folderToDomain(row: PrismaMediaFolder): MediaFolder {
    return MediaFolder.reconstitute(row.id, {
      name: row.name,
      parentId: row.parentId,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
