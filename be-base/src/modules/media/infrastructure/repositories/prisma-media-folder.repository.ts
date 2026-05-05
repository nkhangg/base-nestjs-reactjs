import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { MediaFolder } from '../../domain/entities/media-folder.entity';
import type { IMediaFolderRepository } from '../../domain/repositories/media-folder.repository';
import { MediaMapper } from '../mappers/media.mapper';

@Injectable()
export class PrismaMediaFolderRepository implements IMediaFolderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<MediaFolder | null> {
    const r = await this.prisma.mediaFolder.findUnique({ where: { id } });
    return r ? MediaMapper.folderToDomain(r) : null;
  }

  async findByParentId(parentId: string | null): Promise<MediaFolder[]> {
    const rows = await this.prisma.mediaFolder.findMany({
      where: { parentId },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => MediaMapper.folderToDomain(r));
  }

  async findAll(): Promise<MediaFolder[]> {
    const rows = await this.prisma.mediaFolder.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => MediaMapper.folderToDomain(r));
  }

  async hasChildren(id: string): Promise<boolean> {
    const count = await this.prisma.mediaFolder.count({
      where: { parentId: id },
    });
    return count > 0;
  }

  async hasFiles(id: string): Promise<boolean> {
    const count = await this.prisma.mediaFile.count({
      where: { folderId: id },
    });
    return count > 0;
  }

  async save(folder: MediaFolder): Promise<void> {
    const data = {
      name: folder.name,
      parentId: folder.parentId,
      createdBy: folder.createdBy,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
    await this.prisma.mediaFolder.upsert({
      where: { id: folder.id.value },
      create: { id: folder.id.value, ...data },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.mediaFolder.delete({ where: { id } });
  }
}
