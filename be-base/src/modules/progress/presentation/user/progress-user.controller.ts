import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { GetDashboardUseCase } from '../../application/use-cases/get-dashboard.use-case';
import { GetDetailedProgressUseCase } from '../../application/use-cases/get-detailed-progress.use-case';
import { UpdateArticleProgressUseCase } from '../../application/use-cases/update-article-progress.use-case';

// ── DTOs ──────────────────────────────────────────────────────────────────────

class UpdateArticleProgressDto {
  @ApiPropertyOptional({ minimum: 0, description: 'Scroll position in pixels' })
  @IsOptional()
  @IsInt()
  @Min(0)
  lastScrollPosition?: number;

  @ApiPropertyOptional({ description: 'Mark article as completed' })
  @IsOptional()
  @IsBoolean()
  markCompleted?: boolean;
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Progress (User)')
@ApiCookieAuth('access_token')
@Controller()
export class ProgressUserController {
  constructor(
    private readonly getDashboardUseCase: GetDashboardUseCase,
    private readonly getDetailedProgressUseCase: GetDetailedProgressUseCase,
    private readonly updateArticleProgressUseCase: UpdateArticleProgressUseCase,
  ) {}

  @Get('me/dashboard')
  @ApiOperation({ summary: 'Get my learning dashboard overview' })
  async getDashboard(@Request() req: { user: { userId: string } }) {
    const data = await this.getDashboardUseCase.execute(req.user.userId);
    return {
      user: data.user,
      dueFlashcardsCount: data.dueFlashcardsCount,
      recentActivity: data.recentActivity.map((l) => ({
        id: l.id.value,
        actionType: l.actionType,
        xpGained: l.xpGained,
        referenceId: l.referenceId,
        createdAt: l.createdAt,
      })),
      articleProgress: data.articleProgress.map(progressToJson),
    };
  }

  @Get('me/progress')
  @ApiOperation({ summary: 'Get detailed progress — heatmap, XP timeline' })
  async getDetailedProgress(@Request() req: { user: { userId: string } }) {
    return this.getDetailedProgressUseCase.execute(req.user.userId);
  }

  @Post('me/articles/:id/progress')
  @ApiOperation({ summary: 'Update reading progress for an article' })
  @ApiBody({ type: UpdateArticleProgressDto })
  async updateArticleProgress(
    @Param('id') articleId: string,
    @Body() dto: UpdateArticleProgressDto,
    @Request() req: { user: { userId: string } },
  ) {
    if (dto.lastScrollPosition === undefined && !dto.markCompleted) {
      throw new BadRequestException(
        'Provide lastScrollPosition or markCompleted',
      );
    }
    const progress = await this.updateArticleProgressUseCase.execute({
      userId: req.user.userId,
      articleId,
      lastScrollPosition: dto.lastScrollPosition,
      markCompleted: dto.markCompleted,
    });
    return progressToJson(progress);
  }

  @Get('me/articles/:id/progress')
  @ApiOperation({ summary: 'Get my reading progress for an article' })
  async getArticleProgress(
    @Param('id') articleId: string,
    @Request() req: { user: { userId: string } },
  ) {
    const progress = await this.updateArticleProgressUseCase.execute({
      userId: req.user.userId,
      articleId,
    });
    return progressToJson(progress);
  }
}

function progressToJson(p: {
  userId: string;
  articleId: string;
  status: string;
  lastScrollPosition: number;
  completedAt: Date | null;
}) {
  return {
    articleId: p.articleId,
    status: p.status,
    lastScrollPosition: p.lastScrollPosition,
    completedAt: p.completedAt,
  };
}
