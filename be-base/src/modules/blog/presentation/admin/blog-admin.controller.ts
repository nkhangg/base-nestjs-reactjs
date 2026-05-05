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
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
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
import { CreateBlogPostUseCase } from '../../application/use-cases/create-blog-post.use-case';
import { UpdateBlogPostUseCase } from '../../application/use-cases/update-blog-post.use-case';
import { DeleteBlogPostUseCase } from '../../application/use-cases/delete-blog-post.use-case';
import { GetBlogPostUseCase } from '../../application/use-cases/get-blog-post.use-case';
import { ListBlogPostsUseCase } from '../../application/use-cases/list-blog-posts.use-case';
import { PublishBlogPostUseCase } from '../../application/use-cases/publish-blog-post.use-case';
import { UnpublishBlogPostUseCase } from '../../application/use-cases/unpublish-blog-post.use-case';
import { CreateBlogCategoryUseCase } from '../../application/use-cases/create-blog-category.use-case';
import { UpdateBlogCategoryUseCase } from '../../application/use-cases/update-blog-category.use-case';
import { DeleteBlogCategoryUseCase } from '../../application/use-cases/delete-blog-category.use-case';
import { ListBlogCategoriesUseCase } from '../../application/use-cases/list-blog-categories.use-case';
import type { BlogPost, BlogPostStatus } from '../../domain/entities/blog-post.entity';
import type { BlogCategory } from '../../domain/entities/blog-category.entity';

// ── DTOs ─────────────────────────────────────────────────────────────────────

class CreatePostDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverFileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ['markdown', 'html', 'plain'] })
  @IsOptional()
  @IsIn(['markdown', 'html', 'plain'])
  contentType?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDesc?: string;
}

class UpdatePostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerpt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverFileId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ['markdown', 'html', 'plain'] })
  @IsOptional()
  @IsIn(['markdown', 'html', 'plain'])
  contentType?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitle?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDesc?: string | null;
}

class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverFileId?: string;
}

class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverFileId?: string | null;
}

// ── Pagination configs ────────────────────────────────────────────────────────

const POST_PAGINATE_CONFIG = {
  sortableColumns: ['title', 'createdAt', 'publishedAt'],
  searchableColumns: ['title', 'content', 'excerpt'],
  filterableColumns: {
    status: [FilterOperator.EQ],
    categoryId: [FilterOperator.EQ],
  },
  defaultLimit: 20,
  maxLimit: 100,
};

const CATEGORY_PAGINATE_CONFIG = {
  sortableColumns: ['name', 'createdAt'],
  searchableColumns: ['name', 'description'],
  filterableColumns: {},
  defaultLimit: 50,
  maxLimit: 200,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapPost(p: BlogPost) {
  return {
    id: p.id.value,
    slug: p.slug,
    title: p.title,
    content: p.content,
    contentType: p.contentType,
    excerpt: p.excerpt,
    status: p.status,
    coverFileId: p.coverFileId,
    categoryId: p.categoryId,
    tags: p.tags,
    authorId: p.authorId,
    metaTitle: p.metaTitle,
    metaDesc: p.metaDesc,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function mapCategory(c: BlogCategory) {
  return {
    id: c.id.value,
    name: c.name,
    slug: c.slug,
    description: c.description,
    coverFileId: c.coverFileId,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Blog Management')
@ApiCookieAuth('access_token')
@Controller('admin/blog')
@UseGuards(AdminAuthGuard)
export class BlogAdminController {
  constructor(
    private readonly createPostUseCase: CreateBlogPostUseCase,
    private readonly updatePostUseCase: UpdateBlogPostUseCase,
    private readonly deletePostUseCase: DeleteBlogPostUseCase,
    private readonly getPostUseCase: GetBlogPostUseCase,
    private readonly listPostsUseCase: ListBlogPostsUseCase,
    private readonly publishPostUseCase: PublishBlogPostUseCase,
    private readonly unpublishPostUseCase: UnpublishBlogPostUseCase,
    private readonly createCategoryUseCase: CreateBlogCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateBlogCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteBlogCategoryUseCase,
    private readonly listCategoriesUseCase: ListBlogCategoriesUseCase,
  ) {}

  // ── Posts ──────────────────────────────────────────────────────────────────

  @Post('posts')
  @RequirePermission('blog-management', 'create')
  @ApiOperation({ summary: 'Tạo bài viết mới' })
  @ApiBody({ type: CreatePostDto })
  async createPost(
    @Body() dto: CreatePostDto,
    @Request() req: { user?: { userId?: string } },
  ) {
    const result = await this.createPostUseCase.execute({
      ...dto,
      authorId: req.user?.userId,
      status: dto.status as BlogPostStatus | undefined,
    });
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true, postId: result.value.postId };
  }

  @Get('posts')
  @RequirePermission('blog-management', 'read')
  @ApiOperation({ summary: 'Danh sách bài viết (search, filter, phân trang)' })
  @ApiPaginationQuery(POST_PAGINATE_CONFIG)
  async listPosts(@Paginate() query: PaginateQuery) {
    const { page, limit, search, filter, sortBy } = parsePage(query, POST_PAGINATE_CONFIG);
    const { data, total } = await this.listPostsUseCase.execute({
      page,
      pageSize: limit,
      search,
      sortBy: sortBy?.[0] as 'title' | 'createdAt' | 'publishedAt' | undefined,
      sortDir: sortBy?.[1]?.toLowerCase() as 'asc' | 'desc' | undefined,
      status: filterStr(filter, 'status') as
        | 'draft'
        | 'published'
        | 'archived'
        | undefined,
      categoryId: filterStr(filter, 'categoryId'),
    });
    return buildPaginated(data.map(mapPost), total, query, POST_PAGINATE_CONFIG);
  }

  @Get('posts/:id')
  @RequirePermission('blog-management', 'read')
  @ApiOperation({ summary: 'Chi tiết bài viết' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  async getPost(@Param('id') id: string) {
    const result = await this.getPostUseCase.executeById(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true, data: mapPost(result.value) };
  }

  @Patch('posts/:id')
  @RequirePermission('blog-management', 'update')
  @ApiOperation({ summary: 'Cập nhật bài viết' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiBody({ type: UpdatePostDto })
  async updatePost(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    const result = await this.updatePostUseCase.execute({
      id,
      ...dto,
      status: dto.status as BlogPostStatus | undefined,
    });
    if (!result.ok) {
      if (result.error === 'NOT_FOUND') throw new NotFoundException(result.error);
      throw new BadRequestException(result.error);
    }
    return { success: true };
  }

  @Delete('posts/:id')
  @HttpCode(200)
  @RequirePermission('blog-management', 'delete')
  @ApiOperation({ summary: 'Xóa bài viết' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  async deletePost(@Param('id') id: string) {
    const result = await this.deletePostUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }

  @Post('posts/:id/publish')
  @HttpCode(200)
  @RequirePermission('blog-management', 'publish')
  @ApiOperation({ summary: 'Publish bài viết' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  async publishPost(@Param('id') id: string) {
    const result = await this.publishPostUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }

  @Post('posts/:id/unpublish')
  @HttpCode(200)
  @RequirePermission('blog-management', 'update')
  @ApiOperation({ summary: 'Unpublish bài viết (về draft)' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  async unpublishPost(@Param('id') id: string) {
    const result = await this.unpublishPostUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }

  // ── Categories ─────────────────────────────────────────────────────────────

  @Post('categories')
  @RequirePermission('blog-management', 'create')
  @ApiOperation({ summary: 'Tạo danh mục blog' })
  @ApiBody({ type: CreateCategoryDto })
  async createCategory(@Body() dto: CreateCategoryDto) {
    const result = await this.createCategoryUseCase.execute(dto);
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true, categoryId: result.value.categoryId };
  }

  @Get('categories')
  @RequirePermission('blog-management', 'read')
  @ApiOperation({ summary: 'Danh sách danh mục (search, phân trang)' })
  @ApiPaginationQuery(CATEGORY_PAGINATE_CONFIG)
  async listCategories(@Paginate() query: PaginateQuery) {
    const { page, limit, search, sortBy } = parsePage(query, CATEGORY_PAGINATE_CONFIG);
    const { data, total } = await this.listCategoriesUseCase.execute({
      page,
      pageSize: limit,
      search,
      sortBy: sortBy?.[0] as 'name' | 'createdAt' | undefined,
      sortDir: sortBy?.[1]?.toLowerCase() as 'asc' | 'desc' | undefined,
    });
    return buildPaginated(data.map(mapCategory), total, query, CATEGORY_PAGINATE_CONFIG);
  }

  @Patch('categories/:id')
  @RequirePermission('blog-management', 'update')
  @ApiOperation({ summary: 'Cập nhật danh mục' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiBody({ type: UpdateCategoryDto })
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const result = await this.updateCategoryUseCase.execute({ id, ...dto });
    if (!result.ok) {
      if (result.error === 'NOT_FOUND') throw new NotFoundException(result.error);
      throw new BadRequestException(result.error);
    }
    return { success: true };
  }

  @Delete('categories/:id')
  @HttpCode(200)
  @RequirePermission('blog-management', 'delete')
  @ApiOperation({ summary: 'Xóa danh mục (bài viết giữ nguyên, categoryId = null)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async deleteCategory(@Param('id') id: string) {
    const result = await this.deleteCategoryUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }
}
