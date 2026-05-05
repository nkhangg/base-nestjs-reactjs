import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  Paginate,
  type PaginateQuery,
  ApiPaginationQuery,
} from 'nestjs-paginate';
import { Public } from '../../../../core/auth/infrastructure/auth.guard';
import {
  parsePage,
  buildPaginated,
} from '../../../../shared/application/paginate';
import { ListBlogPostsUseCase } from '../../application/use-cases/list-blog-posts.use-case';
import { GetBlogPostUseCase } from '../../application/use-cases/get-blog-post.use-case';
import type { BlogPost } from '../../domain/entities/blog-post.entity';

const PUBLIC_POST_PAGINATE_CONFIG = {
  sortableColumns: ['publishedAt', 'createdAt', 'title'],
  searchableColumns: ['title', 'excerpt'],
  filterableColumns: {},
  defaultLimit: 10,
  maxLimit: 50,
};

function mapPublicPost(p: BlogPost) {
  return {
    id: p.id.value,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverFileId: p.coverFileId,
    categoryId: p.categoryId,
    tags: p.tags,
    authorId: p.authorId,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
  };
}

@ApiTags('Blog (Public)')
@Controller('blog-posts')
export class BlogPublicController {
  constructor(
    private readonly listPostsUseCase: ListBlogPostsUseCase,
    private readonly getPostUseCase: GetBlogPostUseCase,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Danh sách bài viết đã published (public)' })
  @ApiPaginationQuery(PUBLIC_POST_PAGINATE_CONFIG)
  async listPublished(@Paginate() query: PaginateQuery) {
    const { page, limit, search, sortBy } = parsePage(query, PUBLIC_POST_PAGINATE_CONFIG);
    const { data, total } = await this.listPostsUseCase.execute({
      page,
      pageSize: limit,
      search,
      sortBy: sortBy?.[0] as 'title' | 'createdAt' | 'publishedAt' | undefined,
      sortDir: sortBy?.[1]?.toLowerCase() as 'asc' | 'desc' | undefined,
      publishedOnly: true,
    });
    return buildPaginated(data.map(mapPublicPost), total, query, PUBLIC_POST_PAGINATE_CONFIG);
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Chi tiết bài viết theo slug (public)' })
  @ApiParam({ name: 'slug', description: 'Post slug' })
  async getBySlug(@Param('slug') slug: string) {
    const result = await this.getPostUseCase.executeBySlug(slug);
    if (!result.ok) throw new NotFoundException('Post not found');
    const p = result.value;
    if (p.status !== 'published') throw new NotFoundException('Post not found');
    return {
      success: true,
      data: {
        ...mapPublicPost(p),
        content: p.content,
        metaTitle: p.metaTitle,
        metaDesc: p.metaDesc,
      },
    };
  }
}
