import { Module, OnModuleInit } from '@nestjs/common';
import type { ClassProvider, ValueProvider } from '@nestjs/common';
import {
  AuthorizationService,
  type SeedRoleDefinition,
} from '../../core/authorization';
import { ADMIN_FEATURE } from '../../core/admin-shell/admin.interface';
import { EventsModule } from '../../core/events';
import { ARTICLE_REPOSITORY } from './domain/repositories/article.repository';
import { ARTICLE_CATEGORY_REPOSITORY } from './domain/repositories/article-category.repository';
import { ARTICLE_TAG_REPOSITORY } from './domain/repositories/article-tag.repository';
import { PrismaArticleRepository } from './infrastructure/repositories/prisma-article.repository';
import { PrismaArticleCategoryRepository } from './infrastructure/repositories/prisma-article-category.repository';
import { PrismaArticleTagRepository } from './infrastructure/repositories/prisma-article-tag.repository';
import { CreateArticleUseCase } from './application/use-cases/create-article.use-case';
import { UpdateArticleUseCase } from './application/use-cases/update-article.use-case';
import { DeleteArticleUseCase } from './application/use-cases/delete-article.use-case';
import { GetArticleUseCase } from './application/use-cases/get-article.use-case';
import { GetArticleBySlugUseCase } from './application/use-cases/get-article-by-slug.use-case';
import { ListArticlesUseCase } from './application/use-cases/list-articles.use-case';
import { PublishArticleUseCase } from './application/use-cases/publish-article.use-case';
import { UnpublishArticleUseCase } from './application/use-cases/unpublish-article.use-case';
import { ModerateArticleUseCase } from './application/use-cases/moderate-article.use-case';
import { ListPendingArticlesUseCase } from './application/use-cases/list-pending-articles.use-case';
import { CreateArticleCategoryUseCase } from './application/use-cases/create-article-category.use-case';
import { UpdateArticleCategoryUseCase } from './application/use-cases/update-article-category.use-case';
import { DeleteArticleCategoryUseCase } from './application/use-cases/delete-article-category.use-case';
import { ListArticleCategoriesUseCase } from './application/use-cases/list-article-categories.use-case';
import { CreateArticleTagUseCase } from './application/use-cases/create-article-tag.use-case';
import { DeleteArticleTagUseCase } from './application/use-cases/delete-article-tag.use-case';
import { ListArticleTagsUseCase } from './application/use-cases/list-article-tags.use-case';
import { ArticleAdminController } from './presentation/admin/article-admin.controller';
import { ArticleAdminFeature } from './presentation/admin/article-admin.feature';
import { ArticlePublicController } from './presentation/public/article-public.controller';

const ARTICLE_ROLES: SeedRoleDefinition[] = [
  {
    name: 'article-editor',
    subjectType: 'admin',
    description: 'Full CRUD + moderate + publish articles',
    permissions: {
      'article-management': [
        'read',
        'create',
        'update',
        'delete',
        'publish',
        'approve',
      ],
    },
  },
  {
    name: 'article-viewer',
    subjectType: 'admin',
    description: 'Read-only article management',
    permissions: {
      'article-management': ['read'],
    },
  },
];

@Module({
  imports: [EventsModule],
  controllers: [ArticleAdminController, ArticlePublicController],
  providers: [
    {
      provide: ARTICLE_REPOSITORY,
      useClass: PrismaArticleRepository,
    } as ClassProvider,
    {
      provide: ARTICLE_CATEGORY_REPOSITORY,
      useClass: PrismaArticleCategoryRepository,
    } as ClassProvider,
    {
      provide: ARTICLE_TAG_REPOSITORY,
      useClass: PrismaArticleTagRepository,
    } as ClassProvider,
    {
      provide: ADMIN_FEATURE,
      useValue: ArticleAdminFeature,
      multi: true,
    } as ValueProvider,
    CreateArticleUseCase,
    UpdateArticleUseCase,
    DeleteArticleUseCase,
    GetArticleUseCase,
    GetArticleBySlugUseCase,
    ListArticlesUseCase,
    PublishArticleUseCase,
    UnpublishArticleUseCase,
    ModerateArticleUseCase,
    ListPendingArticlesUseCase,
    CreateArticleCategoryUseCase,
    UpdateArticleCategoryUseCase,
    DeleteArticleCategoryUseCase,
    ListArticleCategoriesUseCase,
    CreateArticleTagUseCase,
    DeleteArticleTagUseCase,
    ListArticleTagsUseCase,
  ],
})
export class ArticleModule implements OnModuleInit {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async onModuleInit(): Promise<void> {
    await this.authorizationService.seedRoles(ARTICLE_ROLES);
  }
}
