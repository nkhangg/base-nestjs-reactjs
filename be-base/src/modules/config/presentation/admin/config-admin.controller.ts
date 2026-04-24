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
  IsDefined,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  Paginate,
  type PaginateQuery,
  ApiPaginationQuery,
  FilterOperator,
} from 'nestjs-paginate';
import { AdminAuthGuard } from '../../../../core/admin-shell/admin-auth.guard';
import { RequirePermission } from '../../../../core/admin-shell/require-permission.decorator';
import { CreateConfigUseCase } from '../../application/use-cases/create-config.use-case';
import { GetConfigByIdUseCase } from '../../application/use-cases/get-config-by-id.use-case';
import { ListConfigsUseCase } from '../../application/use-cases/list-configs.use-case';
import { UpdateConfigUseCase } from '../../application/use-cases/update-config.use-case';
import { ToggleConfigUseCase } from '../../application/use-cases/toggle-config.use-case';
import { DeleteConfigUseCase } from '../../application/use-cases/delete-config.use-case';
import {
  parsePage,
  filterStr,
  filterBool,
  buildPaginated,
} from '../../../../shared/application/paginate';

// ── DTOs ─────────────────────────────────────────────────────────────────────

const KEY_PATTERN = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*$/;

class CreateConfigDto {
  @ApiProperty({ example: 'homepage.hero' })
  @IsString()
  @MaxLength(128)
  @Matches(KEY_PATTERN, {
    message: 'key must be dot-notation: lowercase letters, digits, hyphens',
  })
  key!: string;

  @ApiProperty({ example: { title: 'Hello World' } })
  @IsDefined()
  value!: unknown;

  @ApiPropertyOptional({ example: 'Hero section for homepage' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['public', 'members', 'internal'], default: 'public' })
  @IsOptional()
  @IsIn(['public', 'members', 'internal'])
  scope?: 'public' | 'members' | 'internal';

  @ApiPropertyOptional({ example: ['homepage', 'layout'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

class UpdateConfigDto {
  @ApiPropertyOptional({ example: { title: 'Updated' } })
  @IsOptional()
  value?: unknown;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['public', 'members', 'internal'] })
  @IsOptional()
  @IsIn(['public', 'members', 'internal'])
  scope?: 'public' | 'members' | 'internal';

  @ApiPropertyOptional({ example: ['homepage'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

// ── Pagination config ─────────────────────────────────────────────────────────

const CONFIG_PAGINATE_CONFIG = {
  sortableColumns: ['key', 'scope', 'isEnabled', 'createdAt', 'updatedAt'],
  searchableColumns: ['key'],
  filterableColumns: {
    scope: [FilterOperator.EQ],
    isEnabled: [FilterOperator.EQ],
  },
  defaultLimit: 20,
  maxLimit: 100,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapConfig(c: {
  id: { value: string };
  key: { value: string };
  value: unknown;
  description: string | null;
  isEnabled: boolean;
  scope: string;
  tags: string[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: c.id.value,
    key: c.key.value,
    value: c.value,
    description: c.description,
    isEnabled: c.isEnabled,
    scope: c.scope,
    tags: c.tags,
    createdBy: c.createdBy,
    updatedBy: c.updatedBy,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Config Management')
@ApiCookieAuth('access_token')
@Controller('admin/configs')
@UseGuards(AdminAuthGuard)
export class ConfigAdminController {
  constructor(
    private readonly createConfigUseCase: CreateConfigUseCase,
    private readonly getConfigByIdUseCase: GetConfigByIdUseCase,
    private readonly listConfigsUseCase: ListConfigsUseCase,
    private readonly updateConfigUseCase: UpdateConfigUseCase,
    private readonly toggleConfigUseCase: ToggleConfigUseCase,
    private readonly deleteConfigUseCase: DeleteConfigUseCase,
  ) {}

  @Post()
  @RequirePermission('config-management', 'create')
  @ApiOperation({ summary: 'Tạo config mới' })
  @ApiBody({ type: CreateConfigDto })
  async createConfig(
    @Body() dto: CreateConfigDto,
    @Request() req: { user?: { userId?: string } },
  ) {
    const result = await this.createConfigUseCase.execute({
      key: dto.key,
      value: dto.value,
      description: dto.description,
      scope: dto.scope,
      tags: dto.tags,
      createdBy: req.user?.userId,
    });
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true, configId: result.value.configId };
  }

  @Get()
  @RequirePermission('config-management', 'read')
  @ApiOperation({ summary: 'Danh sách configs (search, filter, phân trang)' })
  @ApiPaginationQuery(CONFIG_PAGINATE_CONFIG)
  async listConfigs(@Paginate() query: PaginateQuery) {
    const { page, limit, search, filter, sortBy } = parsePage(
      query,
      CONFIG_PAGINATE_CONFIG,
    );
    const { data, total } = await this.listConfigsUseCase.execute({
      page,
      pageSize: limit,
      search,
      sortBy: sortBy?.[0] as
        | 'key'
        | 'scope'
        | 'isEnabled'
        | 'createdAt'
        | 'updatedAt'
        | undefined,
      sortDir: sortBy?.[1]?.toLowerCase() as 'asc' | 'desc' | undefined,
      scope: filterStr(filter, 'scope') as
        | 'public'
        | 'members'
        | 'internal'
        | undefined,
      isEnabled: filterBool(filter, 'isEnabled'),
    });

    return buildPaginated(data.map(mapConfig), total, query, CONFIG_PAGINATE_CONFIG);
  }

  @Get(':id')
  @RequirePermission('config-management', 'read')
  @ApiOperation({ summary: 'Chi tiết config' })
  @ApiParam({ name: 'id', description: 'Config ID' })
  async getConfig(@Param('id') id: string) {
    const result = await this.getConfigByIdUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true, data: mapConfig(result.value) };
  }

  @Patch(':id')
  @RequirePermission('config-management', 'update')
  @ApiOperation({ summary: 'Cập nhật value/description/tags/scope' })
  @ApiParam({ name: 'id', description: 'Config ID' })
  @ApiBody({ type: UpdateConfigDto })
  async updateConfig(
    @Param('id') id: string,
    @Body() dto: UpdateConfigDto,
    @Request() req: { user?: { userId?: string } },
  ) {
    const result = await this.updateConfigUseCase.execute({
      id,
      value: dto.value,
      description: dto.description,
      scope: dto.scope,
      tags: dto.tags,
      updatedBy: req.user?.userId,
    });
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }

  @Patch(':id/toggle')
  @HttpCode(200)
  @RequirePermission('config-management', 'update')
  @ApiOperation({ summary: 'Bật/tắt isEnabled' })
  @ApiParam({ name: 'id', description: 'Config ID' })
  async toggleConfig(@Param('id') id: string) {
    const result = await this.toggleConfigUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true, isEnabled: result.value.isEnabled };
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermission('config-management', 'delete')
  @ApiOperation({ summary: 'Xóa config' })
  @ApiParam({ name: 'id', description: 'Config ID' })
  async deleteConfig(@Param('id') id: string) {
    const result = await this.deleteConfigUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }
}
