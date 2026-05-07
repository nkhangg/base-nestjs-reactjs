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
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
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
  filterBool,
  buildPaginated,
} from '../../../../shared/application/paginate';
import { CreateQuestionUseCase } from '../../application/use-cases/create-question.use-case';
import { UpdateQuestionUseCase } from '../../application/use-cases/update-question.use-case';
import { DeleteQuestionUseCase } from '../../application/use-cases/delete-question.use-case';
import { GetQuestionUseCase } from '../../application/use-cases/get-question.use-case';
import { ListQuestionsUseCase } from '../../application/use-cases/list-questions.use-case';
import { ModerateQuestionUseCase } from '../../application/use-cases/moderate-question.use-case';
import type {
  Question,
  QuestionData,
  QuestionReferenceType,
} from '../../domain/entities/question.entity';

// ── DTOs ──────────────────────────────────────────────────────────────────────

class CreateQuestionDto {
  @ApiProperty({
    description:
      'JSON question data (type, prompt, choices, answer, explanation, jlptLevel)',
  })
  @IsObject()
  questionData!: QuestionData;

  @ApiPropertyOptional({ enum: ['article', 'dictionary', 'none'] })
  @IsOptional()
  @IsEnum(['article', 'dictionary', 'none'])
  referenceType?: QuestionReferenceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

class UpdateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  questionData?: QuestionData;

  @ApiPropertyOptional({ enum: ['article', 'dictionary', 'none'] })
  @IsOptional()
  @IsEnum(['article', 'dictionary', 'none'])
  referenceType?: QuestionReferenceType | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

// ── Pagination config ──────────────────────────────────────────────────────────

const ADMIN_PAGINATE_CONFIG = {
  sortableColumns: ['status', 'referenceType', 'createdAt'],
  searchableColumns: [],
  filterableColumns: {
    status: [FilterOperator.EQ],
    referenceType: [FilterOperator.EQ],
    isPublic: [FilterOperator.EQ],
  },
  defaultLimit: 20,
  maxLimit: 100,
};

// ── Helper ─────────────────────────────────────────────────────────────────────

function mapQuestion(q: Question) {
  return {
    id: q.id.value,
    questionData: q.questionData,
    referenceType: q.referenceType,
    referenceId: q.referenceId,
    status: q.status,
    isPublic: q.isPublic,
    creatorId: q.creatorId,
    staffAuthorId: q.staffAuthorId,
    verifiedBy: q.verifiedBy,
    createdAt: q.createdAt,
  };
}

// ── Controller ─────────────────────────────────────────────────────────────────

@ApiTags('Question Management')
@ApiCookieAuth('access_token')
@Controller('admin/questions')
@UseGuards(AdminAuthGuard)
export class QuestionAdminController {
  constructor(
    private readonly createUseCase: CreateQuestionUseCase,
    private readonly updateUseCase: UpdateQuestionUseCase,
    private readonly deleteUseCase: DeleteQuestionUseCase,
    private readonly getUseCase: GetQuestionUseCase,
    private readonly listUseCase: ListQuestionsUseCase,
    private readonly moderateUseCase: ModerateQuestionUseCase,
  ) {}

  // ── Static routes (before :id) ─────────────────────────────────────────────

  @Get()
  @RequirePermission('question-management', 'read')
  @ApiOperation({
    summary: 'Danh sách câu hỏi (filter: status, referenceType, isPublic)',
  })
  @ApiPaginationQuery(ADMIN_PAGINATE_CONFIG)
  async list(@Paginate() query: PaginateQuery) {
    const { page, limit, filter } = parsePage(query, ADMIN_PAGINATE_CONFIG);
    const status = filterStr(filter, 'status') as
      | 'pending'
      | 'approved'
      | 'rejected'
      | undefined;
    const referenceType = filterStr(filter, 'referenceType') ?? undefined;
    const isPublic = filterBool(filter, 'isPublic');

    const { data, total } = await this.listUseCase.execute({
      page,
      pageSize: limit,
      status,
      referenceType,
      isPublic: isPublic ?? undefined,
    });

    return buildPaginated(
      data.map(mapQuestion),
      total,
      query,
      ADMIN_PAGINATE_CONFIG,
    );
  }

  @Post()
  @RequirePermission('question-management', 'create')
  @ApiOperation({ summary: 'Tạo câu hỏi mới (staff → approved)' })
  @ApiBody({ type: CreateQuestionDto })
  async create(
    @Body() dto: CreateQuestionDto,
    @Request() req: { user?: { userId?: string } },
  ) {
    const result = await this.createUseCase.execute({
      ...dto,
      staffAuthorId: req.user?.userId,
      isStaff: true,
    });
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true, questionId: result.value.questionId };
  }

  // ── Param routes ───────────────────────────────────────────────────────────

  @Get(':id')
  @RequirePermission('question-management', 'read')
  @ApiOperation({ summary: 'Chi tiết câu hỏi' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  async getOne(@Param('id') id: string) {
    const result = await this.getUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true, data: mapQuestion(result.value) };
  }

  @Patch(':id')
  @RequirePermission('question-management', 'update')
  @ApiOperation({ summary: 'Cập nhật câu hỏi' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiBody({ type: UpdateQuestionDto })
  async update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    const result = await this.updateUseCase.execute({ id, ...dto });
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermission('question-management', 'delete')
  @ApiOperation({ summary: 'Xóa câu hỏi' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  async delete(@Param('id') id: string) {
    const result = await this.deleteUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }

  @Post(':id/approve')
  @HttpCode(200)
  @RequirePermission('question-management', 'approve')
  @ApiOperation({ summary: 'Approve câu hỏi (pending → approved)' })
  @ApiParam({ name: 'id', description: 'Question ID' })
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
  @RequirePermission('question-management', 'approve')
  @ApiOperation({ summary: 'Reject câu hỏi (pending → rejected)' })
  @ApiParam({ name: 'id', description: 'Question ID' })
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
