import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Public } from '../../../../core/auth';
import { GenerateMockTestUseCase } from '../../application/use-cases/generate-mock-test.use-case';
import { SubmitTestResultUseCase } from '../../application/use-cases/submit-test-result.use-case';
import type { Question } from '../../domain/entities/question.entity';

// ── DTOs ───────────────────────────────────────────────────────────────────────

class GenerateMockTestDto {
  @ApiProperty({ minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  count!: number;

  @ApiPropertyOptional({
    description: 'JLPT level (1–5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  jlptLevel?: number;
}

class AnswerItemDto {
  @ApiProperty()
  @IsString()
  questionId!: string;

  @ApiProperty({
    description: 'Submitted answer (string, number, or object for matching)',
  })
  answer!: unknown;
}

class SubmitTestResultDto {
  @ApiProperty({ type: [AnswerItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers!: AnswerItemDto[];
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function mapTestQuestion(q: Question) {
  const {
    answer: _answer,
    explanation: _explanation,
    ...rest
  } = q.questionData;
  return {
    id: q.id.value,
    questionData: rest,
  };
}

// ── Controller ─────────────────────────────────────────────────────────────────

@ApiTags('Mock Test')
@Controller('me/mock-test')
export class QuestionUserController {
  constructor(
    private readonly generateUseCase: GenerateMockTestUseCase,
    private readonly submitUseCase: SubmitTestResultUseCase,
  ) {}

  @Post('generate')
  @Public()
  @ApiOperation({ summary: 'Tạo bộ đề mock test ngẫu nhiên' })
  @ApiBody({ type: GenerateMockTestDto })
  async generate(@Body() dto: GenerateMockTestDto) {
    const { questions } = await this.generateUseCase.execute(dto);
    return { data: questions.map(mapTestQuestion) };
  }

  @Post('submit')
  @Public()
  @ApiOperation({ summary: 'Nộp kết quả mock test' })
  @ApiBody({ type: SubmitTestResultDto })
  async submit(
    @Body() dto: SubmitTestResultDto,
    @Request() req: { user?: { userId?: string } },
  ) {
    const result = await this.submitUseCase.execute({
      userId: req.user?.userId ?? null,
      answers: dto.answers,
    });
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true, data: result.value };
  }
}
