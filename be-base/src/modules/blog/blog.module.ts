import { Module, OnModuleInit } from '@nestjs/common';
import type { ClassProvider, ValueProvider } from '@nestjs/common';
import {
  AuthorizationService,
  type SeedRoleDefinition,
} from '../../core/authorization';
import { ADMIN_FEATURE } from '../../core/admin-shell/admin.interface';
import { EventsModule } from '../../core/events';
import { BLOG_POST_REPOSITORY } from './domain/repositories/blog-post.repository';
import { BLOG_CATEGORY_REPOSITORY } from './domain/repositories/blog-category.repository';
import { PrismaBlogPostRepository } from './infrastructure/repositories/prisma-blog-post.repository';
import { PrismaBlogCategoryRepository } from './infrastructure/repositories/prisma-blog-category.repository';
import { CreateBlogPostUseCase } from './application/use-cases/create-blog-post.use-case';
import { UpdateBlogPostUseCase } from './application/use-cases/update-blog-post.use-case';
import { DeleteBlogPostUseCase } from './application/use-cases/delete-blog-post.use-case';
import { GetBlogPostUseCase } from './application/use-cases/get-blog-post.use-case';
import { ListBlogPostsUseCase } from './application/use-cases/list-blog-posts.use-case';
import { PublishBlogPostUseCase } from './application/use-cases/publish-blog-post.use-case';
import { UnpublishBlogPostUseCase } from './application/use-cases/unpublish-blog-post.use-case';
import { CreateBlogCategoryUseCase } from './application/use-cases/create-blog-category.use-case';
import { UpdateBlogCategoryUseCase } from './application/use-cases/update-blog-category.use-case';
import { DeleteBlogCategoryUseCase } from './application/use-cases/delete-blog-category.use-case';
import { ListBlogCategoriesUseCase } from './application/use-cases/list-blog-categories.use-case';
import { BlogAdminController } from './presentation/admin/blog-admin.controller';
import { BlogAdminFeature } from './presentation/admin/blog-admin.feature';
import { BlogPublicController } from './presentation/public/blog-public.controller';

const BLOG_ROLES: SeedRoleDefinition[] = [
  {
    name: 'blog-editor',
    subjectType: 'admin',
    description: 'Full CRUD + publish blog posts và categories',
    permissions: {
      'blog-management': ['read', 'create', 'update', 'delete', 'publish'],
    },
  },
  {
    name: 'blog-viewer',
    subjectType: 'admin',
    description: 'Read-only blog management',
    permissions: {
      'blog-management': ['read'],
    },
  },
];

@Module({
  imports: [EventsModule],
  controllers: [BlogAdminController, BlogPublicController],
  providers: [
    {
      provide: BLOG_POST_REPOSITORY,
      useClass: PrismaBlogPostRepository,
    } as ClassProvider,
    {
      provide: BLOG_CATEGORY_REPOSITORY,
      useClass: PrismaBlogCategoryRepository,
    } as ClassProvider,
    {
      provide: ADMIN_FEATURE,
      useValue: BlogAdminFeature,
      multi: true,
    } as ValueProvider,
    CreateBlogPostUseCase,
    UpdateBlogPostUseCase,
    DeleteBlogPostUseCase,
    GetBlogPostUseCase,
    ListBlogPostsUseCase,
    PublishBlogPostUseCase,
    UnpublishBlogPostUseCase,
    CreateBlogCategoryUseCase,
    UpdateBlogCategoryUseCase,
    DeleteBlogCategoryUseCase,
    ListBlogCategoriesUseCase,
  ],
})
export class BlogModule implements OnModuleInit {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async onModuleInit(): Promise<void> {
    await this.authorizationService.seedRoles(BLOG_ROLES);
  }
}
