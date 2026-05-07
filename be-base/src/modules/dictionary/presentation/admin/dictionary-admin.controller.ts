import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiBody,
  ApiProperty,
  ApiPropertyOptional,
  ApiParam,
} from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import {
  Paginate,
  type PaginateQuery,
  ApiPaginationQuery,
  FilterOperator,
} from 'nestjs-paginate';
import { AdminAuthGuard } from '../../../../core/admin-shell/admin-auth.guard';
import { RequirePermission } from '../../../../core/admin-shell/require-permission.decorator';
import {
  parsePage,
  filterStr,
  buildPaginated,
} from '../../../../shared/application/paginate';
import { CreateDictionaryEntryUseCase } from '../../application/use-cases/create-dictionary-entry.use-case';
import { UpdateDictionaryEntryUseCase } from '../../application/use-cases/update-dictionary-entry.use-case';
import { DeleteDictionaryEntryUseCase } from '../../application/use-cases/delete-dictionary-entry.use-case';
import { GetDictionaryEntryUseCase } from '../../application/use-cases/get-dictionary-entry.use-case';
import { SearchDictionaryUseCase } from '../../application/use-cases/search-dictionary.use-case';
import { ModerateDictionaryEntryUseCase } from '../../application/use-cases/moderate-dictionary-entry.use-case';
import { ListPendingEntriesUseCase } from '../../application/use-cases/list-pending-entries.use-case';
import type { DictionaryEntry } from '../../domain/entities/dictionary-entry.entity';

// ── DTOs ──────────────────────────────────────────────────────────────────────

class CreateEntryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  kanji?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  hiragana!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  romaji!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  meanings!: string[];

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  jlptLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

class UpdateEntryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  kanji?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  hiragana?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  romaji?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  meanings?: string[];

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  jlptLevel?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

// ── Pagination config ─────────────────────────────────────────────────────────

const ADMIN_PAGINATE_CONFIG = {
  sortableColumns: ['hiragana', 'jlptLevel', 'createdAt'],
  searchableColumns: ['hiragana', 'romaji', 'kanji'],
  filterableColumns: {
    status: [FilterOperator.EQ],
    jlptLevel: [FilterOperator.EQ],
  },
  defaultLimit: 20,
  maxLimit: 100,
};

const PENDING_PAGINATE_CONFIG = {
  sortableColumns: ['createdAt'],
  searchableColumns: [],
  filterableColumns: {},
  defaultLimit: 20,
  maxLimit: 100,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapEntry(e: DictionaryEntry) {
  return {
    id: e.id.value,
    kanji: e.kanji,
    hiragana: e.hiragana,
    romaji: e.romaji,
    meanings: e.meanings,
    jlptLevel: e.jlptLevel,
    status: e.status,
    isPublic: e.isPublic,
    creatorId: e.creatorId,
    staffAuthorId: e.staffAuthorId,
    verifiedBy: e.verifiedBy,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Dictionary Management')
@ApiCookieAuth('access_token')
@Controller('admin/dictionary')
@UseGuards(AdminAuthGuard)
export class DictionaryAdminController {
  constructor(
    private readonly createUseCase: CreateDictionaryEntryUseCase,
    private readonly updateUseCase: UpdateDictionaryEntryUseCase,
    private readonly deleteUseCase: DeleteDictionaryEntryUseCase,
    private readonly getUseCase: GetDictionaryEntryUseCase,
    private readonly searchUseCase: SearchDictionaryUseCase,
    private readonly moderateUseCase: ModerateDictionaryEntryUseCase,
    private readonly listPendingUseCase: ListPendingEntriesUseCase,
  ) {}

  @Post()
  @RequirePermission('dictionary-management', 'create')
  @ApiOperation({ summary: 'Tạo từ điển entry mới (staff → approved)' })
  @ApiBody({ type: CreateEntryDto })
  async create(
    @Body() dto: CreateEntryDto,
    @Request() req: { user?: { userId?: string } },
  ) {
    const result = await this.createUseCase.execute({
      ...dto,
      staffAuthorId: req.user?.userId,
      isStaff: true,
    });
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true, entryId: result.value.entryId };
  }

  @Get('pending')
  @RequirePermission('dictionary-management', 'read')
  @ApiOperation({ summary: 'Danh sách entry chờ duyệt' })
  @ApiPaginationQuery(PENDING_PAGINATE_CONFIG)
  async listPending(@Paginate() query: PaginateQuery) {
    const { page, limit } = parsePage(query, PENDING_PAGINATE_CONFIG);
    const { data, total } = await this.listPendingUseCase.execute({
      page,
      pageSize: limit,
    });
    return buildPaginated(
      data.map(mapEntry),
      total,
      query,
      PENDING_PAGINATE_CONFIG,
    );
  }

  @Get()
  @RequirePermission('dictionary-management', 'read')
  @ApiOperation({
    summary: 'Danh sách tất cả entries (search, filter, phân trang)',
  })
  @ApiPaginationQuery(ADMIN_PAGINATE_CONFIG)
  async list(@Paginate() query: PaginateQuery) {
    const { page, limit, search, filter } = parsePage(
      query,
      ADMIN_PAGINATE_CONFIG,
    );
    const jlptRaw = filterStr(filter, 'jlptLevel');
    const { data, total } = await this.searchUseCase.execute({
      query: search,
      jlptLevel: jlptRaw ? parseInt(jlptRaw, 10) : undefined,
      page,
      pageSize: limit,
    });
    return buildPaginated(
      data.map(mapEntry),
      total,
      query,
      ADMIN_PAGINATE_CONFIG,
    );
  }

  @Get(':id')
  @RequirePermission('dictionary-management', 'read')
  @ApiOperation({ summary: 'Chi tiết entry' })
  @ApiParam({ name: 'id', description: 'Entry ID' })
  async getOne(@Param('id') id: string) {
    const result = await this.getUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true, data: mapEntry(result.value) };
  }

  @Patch(':id')
  @RequirePermission('dictionary-management', 'update')
  @ApiOperation({ summary: 'Cập nhật entry' })
  @ApiParam({ name: 'id', description: 'Entry ID' })
  @ApiBody({ type: UpdateEntryDto })
  async update(@Param('id') id: string, @Body() dto: UpdateEntryDto) {
    const result = await this.updateUseCase.execute({ id, ...dto });
    if (!result.ok) {
      if (result.error === 'NOT_FOUND')
        throw new NotFoundException(result.error);
      throw new BadRequestException(result.error);
    }
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermission('dictionary-management', 'delete')
  @ApiOperation({ summary: 'Xóa entry' })
  @ApiParam({ name: 'id', description: 'Entry ID' })
  async delete(@Param('id') id: string) {
    const result = await this.deleteUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }

  @Post(':id/approve')
  @HttpCode(200)
  @RequirePermission('dictionary-management', 'approve')
  @ApiOperation({ summary: 'Approve entry' })
  @ApiParam({ name: 'id', description: 'Entry ID' })
  async approve(
    @Param('id') id: string,
    @Request() req: { user?: { userId?: string } },
  ) {
    const result = await this.moderateUseCase.execute({
      id,
      action: 'approve',
      adminId: req.user?.userId ?? '',
    });
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }

  @Post(':id/reject')
  @HttpCode(200)
  @RequirePermission('dictionary-management', 'approve')
  @ApiOperation({ summary: 'Reject entry' })
  @ApiParam({ name: 'id', description: 'Entry ID' })
  async reject(
    @Param('id') id: string,
    @Request() req: { user?: { userId?: string } },
  ) {
    const result = await this.moderateUseCase.execute({
      id,
      action: 'reject',
      adminId: req.user?.userId ?? '',
    });
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }
}
