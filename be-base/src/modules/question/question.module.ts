import { Module, OnModuleInit } from '@nestjs/common';
import type { ClassProvider, ValueProvider } from '@nestjs/common';
import {
  AuthorizationService,
  type SeedRoleDefinition,
} from '../../core/authorization';
import { ADMIN_FEATURE } from '../../core/admin-shell/admin.interface';
import { EventsModule } from '../../core/events';
import { QUESTION_REPOSITORY } from './domain/repositories/question.repository';
import { PrismaQuestionRepository } from './infrastructure/repositories/prisma-question.repository';
import { CreateQuestionUseCase } from './application/use-cases/create-question.use-case';
import { UpdateQuestionUseCase } from './application/use-cases/update-question.use-case';
import { DeleteQuestionUseCase } from './application/use-cases/delete-question.use-case';
import { GetQuestionUseCase } from './application/use-cases/get-question.use-case';
import { ListQuestionsUseCase } from './application/use-cases/list-questions.use-case';
import { ModerateQuestionUseCase } from './application/use-cases/moderate-question.use-case';
import { GenerateMockTestUseCase } from './application/use-cases/generate-mock-test.use-case';
import { SubmitTestResultUseCase } from './application/use-cases/submit-test-result.use-case';
import { QuestionAdminController } from './presentation/admin/question-admin.controller';
import { QuestionAdminFeature } from './presentation/admin/question-admin.feature';
import { QuestionPublicController } from './presentation/public/question-public.controller';
import { QuestionUserController } from './presentation/user/question-user.controller';

const QUESTION_ROLES: SeedRoleDefinition[] = [
  {
    name: 'question-editor',
    subjectType: 'admin',
    description: 'Full CRUD + moderate questions',
    permissions: {
      'question-management': ['read', 'create', 'update', 'delete', 'approve'],
    },
  },
  {
    name: 'question-viewer',
    subjectType: 'admin',
    description: 'Read-only question management',
    permissions: {
      'question-management': ['read'],
    },
  },
];

@Module({
  imports: [EventsModule],
  controllers: [
    QuestionAdminController,
    QuestionPublicController,
    QuestionUserController,
  ],
  providers: [
    {
      provide: QUESTION_REPOSITORY,
      useClass: PrismaQuestionRepository,
    } as ClassProvider,
    {
      provide: ADMIN_FEATURE,
      useValue: QuestionAdminFeature,
      multi: true,
    } as ValueProvider,
    CreateQuestionUseCase,
    UpdateQuestionUseCase,
    DeleteQuestionUseCase,
    GetQuestionUseCase,
    ListQuestionsUseCase,
    ModerateQuestionUseCase,
    GenerateMockTestUseCase,
    SubmitTestResultUseCase,
  ],
})
export class QuestionModule implements OnModuleInit {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async onModuleInit(): Promise<void> {
    await this.authorizationService.seedRoles(QUESTION_ROLES);
  }
}
