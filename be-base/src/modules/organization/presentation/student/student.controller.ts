import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { JoinClassroomByCodeUseCase } from '../../application/use-cases/join-classroom-by-code.use-case';
import { ListMyClassroomsUseCase } from '../../application/use-cases/list-my-classrooms.use-case';
import type { Classroom } from '../../domain/entities/classroom.entity';

// ── DTOs ──────────────────────────────────────────────────────────────────────

class JoinClassroomDto {
  @ApiProperty({ description: '8-character invite code' })
  @IsString()
  inviteCode!: string;
}

class PaginationQuery {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

// ── Serializer ────────────────────────────────────────────────────────────────

function classroomToJson(c: Classroom) {
  return {
    id: c.id.value,
    orgId: c.orgId,
    name: c.name,
    createdAt: c.createdAt,
  };
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Student')
@ApiCookieAuth('access_token')
@Controller('me/classrooms')
export class StudentController {
  constructor(
    private readonly listMyClassroomsUseCase: ListMyClassroomsUseCase,
    private readonly joinUseCase: JoinClassroomByCodeUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List classrooms I have joined' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listMyClassrooms(
    @Query() query: PaginationQuery,
    @Request() req: { user: { userId: string } },
  ) {
    const { data, total } = await this.listMyClassroomsUseCase.execute({
      userId: req.user.userId,
      page: query.page ?? 1,
      pageSize: query.limit ?? 20,
    });
    return { data: data.map(classroomToJson), total };
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a classroom using an invite code' })
  @ApiBody({ type: JoinClassroomDto })
  async joinClassroom(
    @Body() dto: JoinClassroomDto,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.joinUseCase.execute({
      inviteCode: dto.inviteCode,
      userId: req.user.userId,
    });
    if (!result.ok) throw new BadRequestException(result.error);
    return result.value;
  }
}
