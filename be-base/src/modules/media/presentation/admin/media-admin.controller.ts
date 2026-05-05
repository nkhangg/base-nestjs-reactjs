import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { AdminAuthGuard } from '../../../../core/admin-shell/admin-auth.guard';
import { RequirePermission } from '../../../../core/admin-shell/require-permission.decorator';
import {
  MEDIA_FILE_REPOSITORY,
  type IMediaFileRepository,
} from '../../domain/repositories/media-file.repository';
import { UploadFileUseCase } from '../../application/use-cases/upload-file.use-case';
import { ListFilesUseCase } from '../../application/use-cases/list-files.use-case';
import { GetFileUseCase } from '../../application/use-cases/get-file.use-case';
import { UpdateFileMetaUseCase } from '../../application/use-cases/update-file-meta.use-case';
import { DeleteFileUseCase } from '../../application/use-cases/delete-file.use-case';
import { GetSignedUrlUseCase } from '../../application/use-cases/get-signed-url.use-case';
import { ListFoldersUseCase } from '../../application/use-cases/list-folders.use-case';
import { CreateFolderUseCase } from '../../application/use-cases/create-folder.use-case';
import { RenameFolderUseCase } from '../../application/use-cases/rename-folder.use-case';
import { MoveFolderUseCase } from '../../application/use-cases/move-folder.use-case';
import { DeleteFolderUseCase } from '../../application/use-cases/delete-folder.use-case';
import type { MediaFile } from '../../domain/entities/media-file.entity';

// ── DTOs ─────────────────────────────────────────────────────────────────────

class UpdateFileMetaDto {
  @ApiPropertyOptional() @IsOptional() @IsString() filename?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() alt?: string;
  @ApiPropertyOptional({ example: ['hero', 'banner'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  @ApiPropertyOptional({ enum: ['public', 'private'] })
  @IsOptional()
  @IsIn(['public', 'private'])
  scope?: 'public' | 'private';
  @ApiPropertyOptional() @IsOptional() @IsString() folderId?: string;
}

class CreateFolderDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentId?: string;
}

class RenameFolderDto {
  @ApiProperty() @IsString() name!: string;
}

class MoveFolderDto {
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() parentId?:
    | string
    | null;
}

// ── Helper ────────────────────────────────────────────────────────────────────

const APP_BASE = (process.env.APP_BASE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

/**
 * Always derive the serve URL from key + current scope so that changing scope
 * (public ↔ private) is immediately reflected without a DB url field update.
 *   public  → /media/serve/<key>       (open to everyone)
 *   private → /admin/media/serve/<key> (AdminAuthGuard protected)
 */
function serveUrl(key: string, scope: 'public' | 'private'): string {
  return scope === 'private'
    ? `${APP_BASE}/admin/media/serve/${key}`
    : `${APP_BASE}/media/serve/${key}`;
}

function mapFile(f: MediaFile) {
  return {
    id: f.id.value,
    key: f.key,
    filename: f.filename,
    mimeType: f.mimeType,
    size: f.size,
    width: f.width,
    height: f.height,
    url: serveUrl(f.key, f.scope),
    thumbnailUrl: f.thumbnailKey
      ? serveUrl(f.thumbnailKey, f.scope)
      : undefined,
    alt: f.alt,
    scope: f.scope,
    folderId: f.folderId,
    tags: f.tags,
    createdBy: f.createdBy,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  };
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Media Management')
@ApiCookieAuth('access_token')
@Controller('admin/media')
@UseGuards(AdminAuthGuard)
export class MediaAdminController {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    @Inject(MEDIA_FILE_REPOSITORY)
    private readonly fileRepo: IMediaFileRepository,
    private readonly uploadFileUseCase: UploadFileUseCase,
    private readonly listFilesUseCase: ListFilesUseCase,
    private readonly getFileUseCase: GetFileUseCase,
    private readonly updateFileMetaUseCase: UpdateFileMetaUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
    private readonly getSignedUrlUseCase: GetSignedUrlUseCase,
    private readonly listFoldersUseCase: ListFoldersUseCase,
    private readonly createFolderUseCase: CreateFolderUseCase,
    private readonly renameFolderUseCase: RenameFolderUseCase,
    private readonly moveFolderUseCase: MoveFolderUseCase,
    private readonly deleteFolderUseCase: DeleteFolderUseCase,
  ) {}

  // ── Serve (stream file from local storage) ────────────────────────────────

  @Get('serve/:year/:month/:filename')
  @RequirePermission('media-management', 'read')
  @ApiOperation({
    summary: 'Stream any file (public or private); protected by AdminAuthGuard',
  })
  @ApiParam({ name: 'year' })
  @ApiParam({ name: 'month' })
  @ApiParam({ name: 'filename' })
  async serveFile(
    @Param('year') year: string,
    @Param('month') month: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    if ([year, month, filename].some((s) => s.includes('..') || s.includes('/'))) {
      throw new NotFoundException();
    }

    const key = `${year}/${month}/${filename}`;
    const file = await this.fileRepo.findByKey(key);
    if (!file) throw new NotFoundException();

    const filePath = path.join(this.uploadDir, year, month, filename);
    if (!fs.existsSync(filePath)) throw new NotFoundException();

    res.sendFile(filePath, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  // ── Files ──────────────────────────────────────────────────────────────────

  @Post('files/upload')
  @RequirePermission('media-management', 'create')
  @ApiOperation({ summary: 'Upload file(s)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        scope: { type: 'string', enum: ['public', 'private'] },
        folderId: { type: 'string' },
        tags: { type: 'string', description: 'comma-separated tags' },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('scope') scope: string,
    @Body('folderId') folderId: string,
    @Body('tags') tags: string,
    @Request() req: { user?: { userId?: string } },
  ) {
    if (!files || files.length === 0)
      throw new BadRequestException('No files provided');
    const tagList = tags
      ? tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const results = await Promise.all(
      files.map((f) =>
        this.uploadFileUseCase.execute({
          buffer: f.buffer,
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          scope: scope === 'private' ? 'private' : 'public',
          folderId: folderId || undefined,
          tags: tagList,
          createdBy: req.user?.userId,
        }),
      ),
    );
    return { success: true, data: results.map(mapFile) };
  }

  @Get('files')
  @RequirePermission('media-management', 'read')
  @ApiOperation({ summary: 'Danh sách files (paginated + filter)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'scope', required: false, enum: ['public', 'private'] })
  @ApiQuery({
    name: 'mimeType',
    required: false,
    description: 'e.g. image/, video/',
  })
  @ApiQuery({ name: 'folderId', required: false })
  async listFiles(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('scope') scope?: string,
    @Query('mimeType') mimeType?: string,
    @Query('folderId') folderId?: string,
  ) {
    const { data, total } = await this.listFilesUseCase.execute({
      page: page ? parseInt(page, 10) : 1,
      pageSize: limit ? parseInt(limit, 10) : 20,
      search,
      scope:
        scope === 'private'
          ? 'private'
          : scope === 'public'
            ? 'public'
            : undefined,
      mimeType,
      folderId: folderId !== undefined ? folderId || null : undefined,
    });
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return {
      data: data.map(mapFile),
      meta: {
        totalItems: total,
        currentPage: pageNum,
        itemsPerPage: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get('files/:id/signed-url')
  @RequirePermission('media-management', 'read')
  @ApiOperation({ summary: 'URL có thời hạn cho private file' })
  @ApiParam({ name: 'id' })
  async getSignedUrl(@Param('id') id: string) {
    const result = await this.getSignedUrlUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true, data: result.value };
  }

  @Get('files/:id')
  @RequirePermission('media-management', 'read')
  @ApiOperation({ summary: 'Chi tiết file' })
  @ApiParam({ name: 'id' })
  async getFile(@Param('id') id: string) {
    const result = await this.getFileUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true, data: mapFile(result.value) };
  }

  @Patch('files/:id')
  @RequirePermission('media-management', 'update')
  @ApiOperation({ summary: 'Cập nhật metadata file' })
  @ApiParam({ name: 'id' })
  async updateFileMeta(
    @Param('id') id: string,
    @Body() dto: UpdateFileMetaDto,
    @Request() req: { user?: { userId?: string } },
  ) {
    const result = await this.updateFileMetaUseCase.execute({
      id,
      filename: dto.filename,
      alt: dto.alt ?? undefined,
      tags: dto.tags,
      scope: dto.scope,
      folderId: dto.folderId !== undefined ? dto.folderId || null : undefined,
      updatedBy: req.user?.userId,
    });
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }

  @Delete('files/:id')
  @HttpCode(200)
  @RequirePermission('media-management', 'delete')
  @ApiOperation({ summary: 'Xóa file' })
  @ApiParam({ name: 'id' })
  async deleteFile(@Param('id') id: string) {
    const result = await this.deleteFileUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }

  // ── Folders ────────────────────────────────────────────────────────────────

  @Get('folders')
  @RequirePermission('media-management', 'read')
  @ApiOperation({ summary: 'Cây folder (recursive)' })
  async listFolders() {
    const tree = await this.listFoldersUseCase.execute();
    return { success: true, data: tree };
  }

  @Post('folders')
  @RequirePermission('media-management', 'create')
  @ApiOperation({ summary: 'Tạo folder' })
  async createFolder(
    @Body() dto: CreateFolderDto,
    @Request() req: { user?: { userId?: string } },
  ) {
    const result = await this.createFolderUseCase.execute({
      name: dto.name,
      parentId: dto.parentId,
      createdBy: req.user?.userId,
    });
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true, folderId: result.value.folderId };
  }

  @Patch('folders/:id/rename')
  @RequirePermission('media-management', 'update')
  @ApiOperation({ summary: 'Đổi tên folder' })
  @ApiParam({ name: 'id' })
  async renameFolder(@Param('id') id: string, @Body() dto: RenameFolderDto) {
    const result = await this.renameFolderUseCase.execute(id, dto.name);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }

  @Patch('folders/:id/move')
  @RequirePermission('media-management', 'update')
  @ApiOperation({ summary: 'Di chuyển folder' })
  @ApiParam({ name: 'id' })
  async moveFolder(@Param('id') id: string, @Body() dto: MoveFolderDto) {
    const result = await this.moveFolderUseCase.execute(
      id,
      dto.parentId !== undefined ? (dto.parentId ?? null) : null,
    );
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true };
  }

  @Delete('folders/:id')
  @HttpCode(200)
  @RequirePermission('media-management', 'delete')
  @ApiOperation({ summary: 'Xóa folder (chỉ khi rỗng)' })
  @ApiParam({ name: 'id' })
  async deleteFolder(@Param('id') id: string) {
    const result = await this.deleteFolderUseCase.execute(id);
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true };
  }
}
