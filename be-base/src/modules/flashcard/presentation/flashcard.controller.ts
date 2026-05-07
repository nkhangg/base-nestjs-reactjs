import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { AddFlashcardUseCase } from '../application/use-cases/add-flashcard.use-case';
import { DeleteFlashcardUseCase } from '../application/use-cases/delete-flashcard.use-case';
import { GetReviewSessionUseCase } from '../application/use-cases/get-review-session.use-case';
import { ListFlashcardsUseCase } from '../application/use-cases/list-flashcards.use-case';
import { SubmitReviewUseCase } from '../application/use-cases/submit-review.use-case';
import type { FlashcardStatus } from '../domain/entities/flashcard.entity';

// ── DTOs ──────────────────────────────────────────────────────────────────────

class AddFlashcardDto {
  @ApiProperty({ description: 'DictionaryEntry ID to add' })
  @IsUUID()
  dictionaryEntryId!: string;
}

class SubmitReviewDto {
  @ApiProperty({
    minimum: 1,
    maximum: 5,
    description: 'SM-2 rating (1=blackout, 5=perfect)',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
}

class ListFlashcardsQuery {
  @ApiPropertyOptional({ enum: ['new', 'learning', 'mastered'] })
  @IsOptional()
  @IsString()
  @IsIn(['new', 'learning', 'mastered'])
  status?: FlashcardStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Flashcard')
@ApiCookieAuth('access_token')
@Controller('me/flashcards')
export class FlashcardController {
  constructor(
    private readonly addUseCase: AddFlashcardUseCase,
    private readonly listUseCase: ListFlashcardsUseCase,
    private readonly reviewSessionUseCase: GetReviewSessionUseCase,
    private readonly submitReviewUseCase: SubmitReviewUseCase,
    private readonly deleteUseCase: DeleteFlashcardUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add a dictionary entry to my flashcard deck' })
  @ApiBody({ type: AddFlashcardDto })
  async add(
    @Body() dto: AddFlashcardDto,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.addUseCase.execute({
      userId: req.user.userId,
      dictionaryEntryId: dto.dictionaryEntryId,
    });
    if (!result.ok) throw new BadRequestException(result.error);
    return { flashcardId: result.value.flashcardId };
  }

  @Get()
  @ApiOperation({ summary: 'List my flashcards (filter by status)' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['new', 'learning', 'mastered'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async list(
    @Query() query: ListFlashcardsQuery,
    @Request() req: { user: { userId: string } },
  ) {
    const { data, total } = await this.listUseCase.execute({
      userId: req.user.userId,
      status: query.status,
      page: query.page ?? 1,
      pageSize: query.limit ?? 20,
    });
    return { data: data.map(cardToJson), total };
  }

  @Get('due')
  @ApiOperation({ summary: "Get today's due flashcards for review session" })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async due(
    @Query('limit') limit: string | undefined,
    @Request() req: { user: { userId: string } },
  ) {
    const cards = await this.reviewSessionUseCase.execute({
      userId: req.user.userId,
      limit: limit ? Number(limit) : undefined,
    });
    return { data: cards.map(cardToJson) };
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Submit SM-2 rating for a flashcard review' })
  @ApiBody({ type: SubmitReviewDto })
  async review(
    @Param('id') id: string,
    @Body() dto: SubmitReviewDto,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.submitReviewUseCase.execute({
      userId: req.user.userId,
      flashcardId: id,
      rating: dto.rating,
    });
    if (!result.ok) {
      if (result.error === 'Flashcard not found')
        throw new NotFoundException(result.error);
      if (result.error === 'Forbidden') throw new ForbiddenException();
      throw new BadRequestException(result.error);
    }
    return { nextReview: result.value.nextReview };
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove flashcard from my deck' })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.deleteUseCase.execute({
      userId: req.user.userId,
      flashcardId: id,
    });
    if (!result.ok) {
      if (result.error === 'Flashcard not found')
        throw new NotFoundException(result.error);
      if (result.error === 'Forbidden') throw new ForbiddenException();
      throw new BadRequestException(result.error);
    }
    return { success: true };
  }
}

// ── Serializer ────────────────────────────────────────────────────────────────

function cardToJson(card: {
  id: { value: string };
  userId: string;
  dictionaryEntryId: string;
  interval: number;
  easeFactor: number;
  nextReview: Date;
  status: string;
  lastReviewedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: card.id.value,
    dictionaryEntryId: card.dictionaryEntryId,
    interval: card.interval,
    easeFactor: card.easeFactor,
    nextReview: card.nextReview,
    status: card.status,
    lastReviewedAt: card.lastReviewedAt,
    createdAt: card.createdAt,
  };
}
