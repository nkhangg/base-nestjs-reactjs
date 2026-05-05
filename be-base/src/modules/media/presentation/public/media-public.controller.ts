import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Public } from '../../../../core/auth/infrastructure/auth.guard';
import {
  MEDIA_FILE_REPOSITORY,
  type IMediaFileRepository,
} from '../../domain/repositories/media-file.repository';

@ApiTags('Media Public')
@Controller('media')
export class MediaPublicController {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    @Inject(MEDIA_FILE_REPOSITORY)
    private readonly fileRepo: IMediaFileRepository,
  ) {}

  /**
   * Serve public files only. Private files return 404 — no auth logic here.
   * Auth for private files is handled exclusively by AdminAuthGuard on the
   * admin serve endpoint in MediaAdminController.
   */
  @Get('serve/:year/:month/:filename')
  @Public()
  @ApiOperation({ summary: 'Stream a public media file (private files → 404)' })
  @ApiParam({ name: 'year' })
  @ApiParam({ name: 'month' })
  @ApiParam({ name: 'filename' })
  async servePublicFile(
    @Param('year') year: string,
    @Param('month') month: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    if (
      [year, month, filename].some((s) => s.includes('..') || s.includes('/'))
    ) {
      throw new NotFoundException();
    }

    const key = `${year}/${month}/${filename}`;
    const file = await this.fileRepo.findByKey(key);
    if (!file || file.scope !== 'public') throw new NotFoundException();

    const filePath = path.join(this.uploadDir, year, month, filename);
    if (!fs.existsSync(filePath)) throw new NotFoundException();

    res.sendFile(filePath, {
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  }
}
