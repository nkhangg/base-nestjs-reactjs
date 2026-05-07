import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  Paginate,
  type PaginateQuery,
  ApiPaginationQuery,
  FilterOperator,
} from 'nestjs-paginate';
import { Public } from '../../../../core/auth';
import {
  parsePage,
  filterStr,
  buildPaginated,
} from '../../../../shared/application/paginate';
import { ListArticlesUseCase } from '../../application/use-cases/list-articles.use-case';
import { GetArticleBySlugUseCase } from '../../application/use-cases/get-article-by-slug.use-case';
import { ListArticleCategoriesUseCase } from '../../application/use-cases/list-article-categories.use-case';
import type { Article } from '../../domain/entities/article.entity';
import type { ArticleCategory } from '../../domain/entities/article-category.entity';

const PUBLIC_PAGINATE_CONFIG = {
  sortableColumns: ['createdAt', 'level'],
  searchableColumns: ['title'],
  filterableColumns: {
    level: [FilterOperator.EQ],
    categoryId: [FilterOperator.EQ],
    tagId: [FilterOperator.EQ],
  },
  defaultLimit: 20,
  maxLimit: 50,
};

function mapArticleList(a: Article) {
  return {
    id: a.id.value,
    title: a.title,
    slug: a.slug,
    level: a.level,
    status: a.status,
    categoryIds: a.categoryIds,
    tagIds: a.tagIds,
    createdAt: a.createdAt,
  };
}

function mapArticleDetail(a: Article) {
  return {
    id: a.id.value,
    title: a.title,
    slug: a.slug,
    contentRaw: a.contentRaw,
    contentAnnotated: a.contentAnnotated,
    level: a.level,
    status: a.status,
    authorId: a.authorId,
    staffAuthorId: a.staffAuthorId,
    categoryIds: a.categoryIds,
    tagIds: a.tagIds,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
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

@ApiTags('Articles')
@Controller('articles')
export class ArticlePublicController {
  constructor(
    private readonly listUseCase: ListArticlesUseCase,
    private readonly getBySlugUseCase: GetArticleBySlugUseCase,
    private readonly listCategoriesUseCase: ListArticleCategoriesUseCase,
  ) {}

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Danh sách categories' })
  async listCategories() {
    const categories = await this.listCategoriesUseCase.execute();
    return { data: categories.map(mapCategory) };
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Danh sách bài đọc (published)' })
  @ApiPaginationQuery(PUBLIC_PAGINATE_CONFIG)
  async list(@Paginate() query: PaginateQuery) {
    const { page, limit, search, filter } = parsePage(
      query,
      PUBLIC_PAGINATE_CONFIG,
    );
    const levelRaw = filterStr(filter, 'level');
    const categoryId = filterStr(filter, 'categoryId') ?? undefined;
    const tagId = filterStr(filter, 'tagId') ?? undefined;

    const { data, total } = await this.listUseCase.execute({
      page,
      pageSize: limit,
      status: 'published',
      search: search ?? undefined,
      level: levelRaw ? parseInt(levelRaw, 10) : undefined,
      categoryId,
      tagId,
    });

    return buildPaginated(
      data.map(mapArticleList),
      total,
      query,
      PUBLIC_PAGINATE_CONFIG,
    );
  }

  @Get(':slug')
  @Public()
  @ApiOperation({
    summary: 'Chi tiết bài đọc theo slug (kèm contentAnnotated)',
  })
  @ApiParam({ name: 'slug', description: 'Article slug' })
  async getBySlug(@Param('slug') slug: string) {
    const result = await this.getBySlugUseCase.execute(slug);
    if (!result.ok) throw new NotFoundException('Article not found');
    return { success: true, data: mapArticleDetail(result.value) };
  }
}
