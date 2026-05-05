import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { MediaFile } from '../../domain/entities/media-file.entity';
import type {
  FindAllMediaFilesOptions,
  FindAllMediaFilesResult,
  IMediaFileRepository,
} from '../../domain/repositories/media-file.repository';
import { MediaMapper } from '../mappers/media.mapper';

@Injectable()
export class PrismaMediaFileRepository implements IMediaFileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<MediaFile | null> {
    const r = await this.prisma.mediaFile.findUnique({ where: { id } });
    return r ? MediaMapper.fileToDomail(r) : null;
  }

  async findByKey(key: string): Promise<MediaFile | null> {
    // Match either the main file key or the thumbnail key so that both
    // /media/serve/<key> and /media/serve/<thumbKey> resolve to the same record
    // and inherit the same scope / access rules.
    const r = await this.prisma.mediaFile.findFirst({
      where: { OR: [{ key }, { thumbnailKey: key }] },
    });
    return r ? MediaMapper.fileToDomail(r) : null;
  }

  async findAll(
    options: FindAllMediaFilesOptions = {},
  ): Promise<FindAllMediaFilesResult> {
    const where: Record<string, unknown> = {};

    if (options.folderId !== undefined) where['folderId'] = options.folderId;
    if (options.scope !== undefined) where['scope'] = options.scope;
    if (options.mimeType !== undefined) {
      where['mimeType'] = { startsWith: options.mimeType };
    }
    if (options.tags && options.tags.length > 0) {
      where['tags'] = { hasSome: options.tags };
    }
    if (options.search) {
      where['filename'] = { contains: options.search, mode: 'insensitive' };
    }

    const sortBy = options.sortBy ?? 'createdAt';
    const sortDir = options.sortDir ?? 'desc';
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;

    const [rows, total] = await Promise.all([
      this.prisma.mediaFile.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.mediaFile.count({ where }),
    ]);

    return { data: rows.map((r) => MediaMapper.fileToDomail(r)), total };
  }

  async save(file: MediaFile): Promise<void> {
    const data = {
      key: file.key,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
      width: file.width,
      height: file.height,
      url: file.url,
      thumbnailKey: file.thumbnailKey,
      thumbnailUrl: file.thumbnailUrl,
      alt: file.alt,
      scope: file.scope,
      folderId: file.folderId,
      tags: file.tags,
      createdBy: file.createdBy,
      updatedBy: file.updatedBy,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
    await this.prisma.mediaFile.upsert({
      where: { id: file.id.value },
      create: { id: file.id.value, ...data },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.mediaFile.delete({ where: { id } });
  }
}
