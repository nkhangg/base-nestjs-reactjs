import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  Paginate,
  type PaginateQuery,
  ApiPaginationQuery,
} from 'nestjs-paginate';
import { Public } from '../../../../core/auth';
import {
  parsePage,
  buildPaginated,
} from '../../../../shared/application/paginate';
import { ListQuestionsUseCase } from '../../application/use-cases/list-questions.use-case';
import { GetQuestionUseCase } from '../../application/use-cases/get-question.use-case';
import type { Question } from '../../domain/entities/question.entity';

const PUBLIC_PAGINATE_CONFIG = {
  sortableColumns: ['createdAt'],
  searchableColumns: [],
  filterableColumns: {},
  defaultLimit: 20,
  maxLimit: 50,
};

function mapQuestion(q: Question) {
  return {
    id: q.id.value,
    questionData: q.questionData,
    referenceType: q.referenceType,
    referenceId: q.referenceId,
    createdAt: q.createdAt,
  };
}

@ApiTags('Questions')
@Controller('questions')
export class QuestionPublicController {
  constructor(
    private readonly listUseCase: ListQuestionsUseCase,
    private readonly getUseCase: GetQuestionUseCase,
  ) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Danh sách câu hỏi (filter: referenceType, referenceId)',
  })
  @ApiPaginationQuery(PUBLIC_PAGINATE_CONFIG)
  @ApiQuery({
    name: 'referenceType',
    required: false,
    enum: ['article', 'dictionary', 'none'],
  })
  @ApiQuery({ name: 'referenceId', required: false })
  async list(
    @Paginate() query: PaginateQuery,
    @Query('referenceType') referenceType?: string,
    @Query('referenceId') referenceId?: string,
  ) {
    const { page, limit } = parsePage(query, PUBLIC_PAGINATE_CONFIG);

    const { data, total } = await this.listUseCase.execute({
      page,
      pageSize: limit,
      status: 'approved',
      isPublic: true,
      referenceType: referenceType || undefined,
      referenceId: referenceId || undefined,
    });

    return buildPaginated(
      data.map(mapQuestion),
      total,
      query,
      PUBLIC_PAGINATE_CONFIG,
    );
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Chi tiết câu hỏi' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  async getOne(@Param('id') id: string) {
    const result = await this.getUseCase.execute(id);
    if (!result.ok) throw new NotFoundException('Question not found');
    const q = result.value;
    if (!q.isPublic || q.status !== 'approved')
      throw new NotFoundException('Question not found');
    return { success: true, data: mapQuestion(q) };
  }
}
