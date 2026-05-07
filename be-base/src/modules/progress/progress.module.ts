import { Module, OnModuleInit } from '@nestjs/common';
import type { ClassProvider, ValueProvider } from '@nestjs/common';
import {
  AuthorizationService,
  type SeedRoleDefinition,
} from '../../core/authorization';
import { ADMIN_FEATURE } from '../../core/admin-shell/admin.interface';
import { ACTIVITY_LOG_REPOSITORY } from './domain/repositories/activity-log.repository';
import { USER_ARTICLE_PROGRESS_REPOSITORY } from './domain/repositories/user-article-progress.repository';
import { PROGRESS_USER_REPOSITORY } from './domain/repositories/progress-user.repository';
import { PrismaActivityLogRepository } from './infrastructure/repositories/prisma-activity-log.repository';
import { PrismaUserArticleProgressRepository } from './infrastructure/repositories/prisma-user-article-progress.repository';
import { PrismaProgressUserRepository } from './infrastructure/repositories/prisma-progress-user.repository';
import { LogActivityUseCase } from './application/use-cases/log-activity.use-case';
import { GetDashboardUseCase } from './application/use-cases/get-dashboard.use-case';
import { GetDetailedProgressUseCase } from './application/use-cases/get-detailed-progress.use-case';
import { UpdateArticleProgressUseCase } from './application/use-cases/update-article-progress.use-case';
import { GetLeaderboardUseCase } from './application/use-cases/get-leaderboard.use-case';
import { ProgressUserController } from './presentation/user/progress-user.controller';
import { ProgressPublicController } from './presentation/public/progress-public.controller';
import { ProgressAdminController } from './presentation/admin/progress-admin.controller';
import { ProgressAdminFeature } from './presentation/admin/progress-admin.feature';

const PROGRESS_ROLES: SeedRoleDefinition[] = [
  {
    name: 'progress-viewer',
    subjectType: 'admin',
    description: 'View user activity logs and progress',
    permissions: {
      'progress-management': ['read'],
    },
  },
];

@Module({
  controllers: [
    ProgressUserController,
    ProgressPublicController,
    ProgressAdminController,
  ],
  providers: [
    {
      provide: ACTIVITY_LOG_REPOSITORY,
      useClass: PrismaActivityLogRepository,
    } as ClassProvider,
    {
      provide: USER_ARTICLE_PROGRESS_REPOSITORY,
      useClass: PrismaUserArticleProgressRepository,
    } as ClassProvider,
    {
      provide: PROGRESS_USER_REPOSITORY,
      useClass: PrismaProgressUserRepository,
    } as ClassProvider,
    {
      provide: ADMIN_FEATURE,
      useValue: ProgressAdminFeature,
      multi: true,
    } as ValueProvider,
    LogActivityUseCase,
    GetDashboardUseCase,
    GetDetailedProgressUseCase,
    UpdateArticleProgressUseCase,
    GetLeaderboardUseCase,
  ],
  exports: [LogActivityUseCase],
})
export class ProgressModule implements OnModuleInit {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async onModuleInit(): Promise<void> {
    await this.authorizationService.seedRoles(PROGRESS_ROLES);
  }
}
