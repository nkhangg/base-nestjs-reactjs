import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { Public } from '../../../../core/auth/infrastructure/auth.guard';
import {
  GetLeaderboardUseCase,
  type LeaderboardType,
} from '../../application/use-cases/get-leaderboard.use-case';

class LeaderboardQuery {
  @ApiProperty({ enum: ['all-time', 'weekly'], default: 'all-time' })
  @IsOptional()
  @IsString()
  @IsIn(['all-time', 'weekly'])
  type?: LeaderboardType;
}

@ApiTags('Progress (Public)')
@Controller('leaderboard')
export class ProgressPublicController {
  constructor(private readonly getLeaderboardUseCase: GetLeaderboardUseCase) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Top 50 users by XP (all-time or weekly)' })
  @ApiQuery({ name: 'type', required: false, enum: ['all-time', 'weekly'] })
  async leaderboard(@Query() query: LeaderboardQuery) {
    const entries = await this.getLeaderboardUseCase.execute({
      type: query.type ?? 'all-time',
      limit: 50,
    });
    return { data: entries };
  }
}
