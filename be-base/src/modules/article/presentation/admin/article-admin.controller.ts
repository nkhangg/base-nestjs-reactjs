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
  IsInt,
  IsOptional,
  IsString,
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
import { CreateArticleUseCase } from '../../application/use-cases/create-article.use-case';
import { UpdateArticleUseCase } from '../../application/use-cases/update-article.use-case';
import { DeleteArticleUseCase } from '../../application/use-cases/delete-article.use-case';
import { GetArticleUseCase } from '../../application/use-cases/get-article.use-case';
import { ListArticlesUseCase } from '../../application/use-cases/list-articles.use-case';
import { PublishArticleUseCase } from '../../application/use-cases/publish-article.use-case';
import { UnpublishArticleUseCase } from '../../application/use-cases/unpublish-article.use-case';
import { ModerateArticleUseCase } from '../../application/use-cases/moderate-article.use-case';
import { ListPendingArticlesUseCase } from '../../application/use-cases/list-pending-articles.use-case';
import { CreateArticleCategoryUseCase } from '../../application/use-cases/create-article-category.use-case';
import { UpdateArticleCategoryUseCase } from '../../application/use-cases/update-article-category.use-case';
import { DeleteArticleCategoryUseCase } from '../../application/use-cases/delete-article-category.use-case';
import { ListArticleCategoriesUseCase } from '../../application/use-cases/list-article-categories.use-case';
import { CreateArticleTagUseCase } from '../../application/use-cases/create-article-tag.use-case';
import { DeleteArticleTagUseCase } from '../../application/use-cases/delete-article-tag.use-case';
import { ListArticleTagsUseCase } from '../../application/use-cases/list-article-tags.use-case';
import type { Article } from '../../domain/entities/article.entity';
import type { ArticleCategory } from '../../domain/entities/article-category.entity';
import type { ArticleTag } from '../../domain/entities/article-tag.entity';

// ── DTOs ──────────────────────────────────────────────────────────────────────

class CreateArticleDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  slug!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  contentRaw!: string;

  @ApiPropertyOptional()
  @IsOptional()
  contentAnnotated?: Record<string, unknown>;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  level?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}

class UpdateArticleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentRaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  contentAnnotated?: Record<string, unknown> | null;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  level?: number | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}

class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colorCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconUrl?: string;
}

class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colorCode?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconUrl?: string | null;
}

class CreateTagDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;
}

// ── Pagination configs ─────────────────────────────────────────────────────────

const ADMIN_PAGINATE_CONFIG = {
  sortableColumns: ['title', 'level', 'status', 'createdAt'],
  searchableColumns: ['title'],
  filterableColumns: {
    status: [FilterOperator.EQ],
    level: [FilterOperator.EQ],
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

function mapArticle(a: Article) {
  return {
    id: a.id.value,
    title: a.title,
    slug: a.slug,
    level: a.level,
    status: a.status,
    authorId: a.authorId,
    staffAuthorId: a.staffAuthorId,
    verifiedBy: a.verifiedBy,
    categoryIds: a.categoryIds,
    tagIds: a.tagIds,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

function mapArticleDetail(a: Article) {
  return {
    ...mapArticle(a),
    contentRaw: a.contentRaw,
    contentAnnotated: a.contentAnnotated,
  };
}

function mapCategory(c: ArticleCategory) {
  return {
    id: c.id.value,
    name: c.name,
    slug: c.slug,
    colorCode: c.colorCode,
    iconUrl: c.iconUrl,
  };
}

function mapTag(t: ArticleTag) {
  return { id: t.id.value, name: t.name };
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Article Management')
@ApiCookieAuth('access_token')
@Controller('admin/articles')
@UseGuards(AdminAuthGuard)
export class ArticleAdminController {
  constructor(
    private readonly createUseCase: CreateArticleUseCase,
    private readonly updateUseCase: UpdateArticleUseCase,
    private readonly deleteUseCase: DeleteArticleUseCase,
    private readonly getUseCase: GetArticleUseCase,
    private readonly listUseCase: ListArticlesUseCase,
    private readonly publishUseCase: PublishArticleUseCase,
    private readonly unpublishUseCase: UnpublishArticleUseCase,
    private readonly moderateUseCase: ModerateArticleUseCase,
    private readonly listPendingUseCase: ListPendingArticlesUseCase,
    private readonly createCategoryUseCase: CreateArticleCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateArticleCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteArticleCategoryUseCase,
    private readonly listCategoriesUseCase: ListArticleCategoriesUseCase,
    private readonly createTagUseCase: CreateArticleTagUseCase,
    private readonly deleteTagUseCase: DeleteArticleTagUseCase,
    private readonly listTagsUseCase: ListArticleTagsUseCase,
  ) {}

  // ── Static routes (MUST come before :id param routes) ──────────────────────

  @Get('pending')
  @RequirePermission('article-management', 'read')
  @ApiOperation({ summary: 'Danh sách bài đọc chờ duyệt' })
  @ApiPaginationQuery(PENDING_PAGINATE_CONFIG)
  async listPending(@Paginate() query: PaginateQuery) {
    const { page, limit } = parsePage(query, PENDING_PAGINATE_CONFIG);
    const { data, total } = await this.listPendingUseCase.execute(page, limit);
    return buildPaginated(
      data.map(mapArticle),
      total,
      query,
      PENDING_PAGINATE_CONFIG,
    );
  }

  @Get('categories')
  @RequirePermission('article-management', 'read')
  @ApiOperation({ summary: 'Danh sách categories' })
  async listCategories() {
    const categories = await this.listCategoriesUseCase.execute();
    return { data: categories.map(mapCategory) };
  }

  @Post('categories')
  @RequirePermission('article-management', 'create')
  @ApiOperation({ summary: 'Tạo category mới' })
  @ApiBody({ type: CreateCategoryDto })
  async createCategory(@Body() dto: CreateCategoryDto) {
    const result = await this.createCategoryUseCase.execute(dto);
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true, categoryId: result.value.categoryId };
  }

  @Get('tags')
  @RequirePermission('article-management', 'read')
  @ApiOperation({ summary: 'Danh sách tags' })
  async listTags() {
    const tags = await this.listTagsUseCase.execute();
    return { data: tags.map(mapTag) };
  }

  @Post('tags')
  @RequirePermission('article-management', 'create')
  @ApiOperation({ summary: 'Tạo tag mới' })
  @ApiBody({ type: CreateTagDto })
  async createTag(@Body() dto: CreateTagDto) {
    const result = await this.createTagUseCase.execute(dto.name);
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true, tagId: result.value.tagId };
  }

  // ── Article CRUD ───────────────────────────────────────────────────────────

  @Get()
  @RequirePermission('article-management', 'read')
  @ApiOperation({ summary: 'Danh sách tất cả bài đọc (filter: status, level)' })
  @ApiPaginationQuery(ADMIN_PAGINATE_CONFIG)
  async list(@Paginate() query: PaginateQuery) {
    const { page, limit, search, filter } = parsePage(
      query,
      ADMIN_PAGINATE_CONFIG,
    );
    const status = filterStr(filter, 'status') as
      | 'pending'
      | 'approved'
      | 'rejected'
      | 'published'
      | undefined;
    const levelRaw = filterStr(filter, 'level');

    const { data, total } = await this.listUseCase.execute({
      page,
      pageSize: limit,
      status: status ?? undefined,
      search: search ?? undefined,
      level: levelRaw ? parseInt(levelRaw, 10) : undefined,
    });

    return buildPaginated(
      data.map(mapArticle),
      total,
      query,
      ADMIN_PAGINATE_CONFIG,
    );
  }

  @Post()
  @RequirePermission('article-management', 'create')
  @ApiOperation({ summary: 'Tạo bài đọc mới (staff → approved)' })
  @ApiBody({ type: CreateArticleDto })
  async create(
    @Body() dto: CreateArticleDto,
    @Request() req: { user?: { userId?: string } },
  ) {
    const result = await this.createUseCase.execute({
      ...dto,
      staffAuthorId: req.user?.userId,
      isStaff: true,
    });
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true, articleId: result.value.articleId };
  }

  // ── Category param routes ──────────────────────────────────────────────────

  @Patch('categories/:id')
  @RequirePermission('article-management', 'update')
  @ApiOperation({ summary: 'Cập nhật category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiBody({ type: UpdateCategoryDto })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const result = await this.updateCategoryUseCase.execute({ id, ...dto });
    if (!result.ok) {
      if (result.error === 'NOT_FOUND')
        throw new NotFoundException(result.error);
      throw new BadRequestException(result.error);
    }
    return { success: true };
  }

  @Delete('categories/:id')
  @HttpCode(200)
  @RequirePermission('article-management', 'delete')
  @ApiOperation({ summary: 'Xóa category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async deleteCategory(@Param('id') id: string) {
    const result = await this.deleteCategoryUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }

  // ── Tag param routes ───────────────────────────────────────────────────────

  @Delete('tags/:id')
  @HttpCode(200)
  @RequirePermission('article-management', 'delete')
  @ApiOperation({ summary: 'Xóa tag' })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  async deleteTag(@Param('id') id: string) {
    const result = await this.deleteTagUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }

  // ── Article param routes ───────────────────────────────────────────────────

  @Get(':id')
  @RequirePermission('article-management', 'read')
  @ApiOperation({ summary: 'Chi tiết bài đọc (kèm contentAnnotated)' })
  @ApiParam({ name: 'id', description: 'Article ID' })
  async getOne(@Param('id') id: string) {
    const result = await this.getUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true, data: mapArticleDetail(result.value) };
  }

  @Patch(':id')
  @RequirePermission('article-management', 'update')
  @ApiOperation({ summary: 'Cập nhật bài đọc' })
  @ApiParam({ name: 'id', description: 'Article ID' })
  @ApiBody({ type: UpdateArticleDto })
  async update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
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
  @RequirePermission('article-management', 'delete')
  @ApiOperation({ summary: 'Xóa bài đọc' })
  @ApiParam({ name: 'id', description: 'Article ID' })
  async delete(@Param('id') id: string) {
    const result = await this.deleteUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }

  @Post(':id/publish')
  @HttpCode(200)
  @RequirePermission('article-management', 'publish')
  @ApiOperation({ summary: 'Publish bài đọc (approved → published)' })
  @ApiParam({ name: 'id', description: 'Article ID' })
  async publish(
    @Param('id') id: string,
    @Request() req: { user?: { userId?: string } },
  ) {
    const result = await this.publishUseCase.execute(
      id,
      req.user?.userId ?? '',
    );
    if (!result.ok) {
      if (result.error === 'NOT_FOUND')
        throw new NotFoundException(result.error);
      throw new BadRequestException(result.error);
    }
    return { success: true };
  }

  @Post(':id/unpublish')
  @HttpCode(200)
  @RequirePermission('article-management', 'publish')
  @ApiOperation({ summary: 'Unpublish bài đọc (published → approved)' })
  @ApiParam({ name: 'id', description: 'Article ID' })
  async unpublish(@Param('id') id: string) {
    const result = await this.unpublishUseCase.execute(id);
    if (!result.ok) {
      if (result.error === 'NOT_FOUND')
        throw new NotFoundException(result.error);
      throw new BadRequestException(result.error);
    }
    return { success: true };
  }

  @Post(':id/approve')
  @HttpCode(200)
  @RequirePermission('article-management', 'approve')
  @ApiOperation({ summary: 'Approve bài đọc (pending → approved)' })
  @ApiParam({ name: 'id', description: 'Article ID' })
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
  @RequirePermission('article-management', 'approve')
  @ApiOperation({ summary: 'Reject bài đọc (pending → rejected)' })
  @ApiParam({ name: 'id', description: 'Article ID' })
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
