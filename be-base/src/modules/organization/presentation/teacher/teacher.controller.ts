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
  Patch,
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
import { CreateOrganizationUseCase } from '../../application/use-cases/create-organization.use-case';
import { GetOrganizationUseCase } from '../../application/use-cases/get-organization.use-case';
import { ListOrganizationsUseCase } from '../../application/use-cases/list-organizations.use-case';
import { UpdateOrganizationUseCase } from '../../application/use-cases/update-organization.use-case';
import { CreateClassroomUseCase } from '../../application/use-cases/create-classroom.use-case';
import { GetClassroomUseCase } from '../../application/use-cases/get-classroom.use-case';
import { GetClassroomReportUseCase } from '../../application/use-cases/get-classroom-report.use-case';
import { ListClassroomsUseCase } from '../../application/use-cases/list-classrooms.use-case';
import { RemoveMemberUseCase } from '../../application/use-cases/remove-member.use-case';
import type { Organization } from '../../domain/entities/organization.entity';
import type { Classroom } from '../../domain/entities/classroom.entity';

// ── DTOs ──────────────────────────────────────────────────────────────────────

class CreateOrganizationDto {
  @ApiProperty()
  @IsString()
  name!: string;
}

class UpdateOrganizationDto {
  @ApiProperty()
  @IsString()
  name!: string;
}

class CreateClassroomDto {
  @ApiProperty()
  @IsString()
  orgId!: string;

  @ApiProperty()
  @IsString()
  name!: string;
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

// ── Serializers ───────────────────────────────────────────────────────────────

function orgToJson(org: Organization) {
  return {
    id: org.id.value,
    name: org.name,
    ownerId: org.ownerId,
    createdAt: org.createdAt,
  };
}

function classroomToJson(c: Classroom) {
  return {
    id: c.id.value,
    orgId: c.orgId,
    teacherId: c.teacherId,
    name: c.name,
    inviteCode: c.inviteCode,
    createdAt: c.createdAt,
  };
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Teacher')
@ApiCookieAuth('access_token')
@Controller()
export class TeacherController {
  constructor(
    private readonly createOrgUseCase: CreateOrganizationUseCase,
    private readonly listOrgsUseCase: ListOrganizationsUseCase,
    private readonly getOrgUseCase: GetOrganizationUseCase,
    private readonly updateOrgUseCase: UpdateOrganizationUseCase,
    private readonly createClassroomUseCase: CreateClassroomUseCase,
    private readonly listClassroomsUseCase: ListClassroomsUseCase,
    private readonly getClassroomUseCase: GetClassroomUseCase,
    private readonly getReportUseCase: GetClassroomReportUseCase,
    private readonly removeMemberUseCase: RemoveMemberUseCase,
  ) {}

  // ── Organizations ─────────────────────────────────────────────────────────

  @Post('teacher/organizations')
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiBody({ type: CreateOrganizationDto })
  async createOrganization(
    @Body() dto: CreateOrganizationDto,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.createOrgUseCase.execute({
      ownerId: req.user.userId,
      name: dto.name,
    });
    if (!result.ok) throw new BadRequestException(result.error);
    return result.value;
  }

  @Get('teacher/organizations')
  @ApiOperation({ summary: 'List my organizations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listOrganizations(
    @Query() query: PaginationQuery,
    @Request() req: { user: { userId: string } },
  ) {
    const { data, total } = await this.listOrgsUseCase.execute({
      ownerId: req.user.userId,
      page: query.page ?? 1,
      pageSize: query.limit ?? 20,
    });
    return { data: data.map(orgToJson), total };
  }

  @Get('teacher/organizations/:id')
  @ApiOperation({ summary: 'Get organization by ID' })
  async getOrganization(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.getOrgUseCase.execute({
      organizationId: id,
      requesterId: req.user.userId,
    });
    if (!result.ok) {
      if (result.error === 'Forbidden') throw new ForbiddenException();
      throw new NotFoundException(result.error);
    }
    return orgToJson(result.value);
  }

  @Patch('teacher/organizations/:id')
  @ApiOperation({ summary: 'Update organization name' })
  @ApiBody({ type: UpdateOrganizationDto })
  async updateOrganization(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.updateOrgUseCase.execute({
      organizationId: id,
      requesterId: req.user.userId,
      name: dto.name,
    });
    if (!result.ok) {
      if (result.error === 'Forbidden') throw new ForbiddenException();
      throw new NotFoundException(result.error);
    }
    return { success: true };
  }

  // ── Classrooms ────────────────────────────────────────────────────────────

  @Post('teacher/classrooms')
  @ApiOperation({ summary: 'Create a classroom inside an organization' })
  @ApiBody({ type: CreateClassroomDto })
  async createClassroom(
    @Body() dto: CreateClassroomDto,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.createClassroomUseCase.execute({
      orgId: dto.orgId,
      teacherId: req.user.userId,
      name: dto.name,
    });
    if (!result.ok) {
      if (result.error === 'Forbidden') throw new ForbiddenException();
      throw new BadRequestException(result.error);
    }
    return result.value;
  }

  @Get('teacher/classrooms')
  @ApiOperation({ summary: 'List classrooms where I am the teacher' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listClassrooms(
    @Query() query: PaginationQuery,
    @Request() req: { user: { userId: string } },
  ) {
    const { data, total } = await this.listClassroomsUseCase.execute({
      teacherId: req.user.userId,
      page: query.page ?? 1,
      pageSize: query.limit ?? 20,
    });
    return { data: data.map(classroomToJson), total };
  }

  @Get('teacher/classrooms/:id/report')
  @ApiOperation({ summary: 'Get member progress report for a classroom' })
  async getClassroomReport(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.getReportUseCase.execute({
      classroomId: id,
      teacherId: req.user.userId,
    });
    if (!result.ok) {
      if (result.error === 'Forbidden') throw new ForbiddenException();
      throw new NotFoundException(result.error);
    }
    return { data: result.value };
  }

  @Get('teacher/classrooms/:id')
  @ApiOperation({ summary: 'Get classroom by ID' })
  async getClassroom(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.getClassroomUseCase.execute({
      classroomId: id,
      teacherId: req.user.userId,
    });
    if (!result.ok) {
      if (result.error === 'Forbidden') throw new ForbiddenException();
      throw new NotFoundException(result.error);
    }
    return classroomToJson(result.value);
  }

  @Delete('teacher/classrooms/:classroomId/members/:userId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove a member from classroom' })
  async removeMember(
    @Param('classroomId') classroomId: string,
    @Param('userId') userId: string,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.removeMemberUseCase.execute({
      classroomId,
      userId,
      teacherId: req.user.userId,
    });
    if (!result.ok) {
      if (result.error === 'Forbidden') throw new ForbiddenException();
      if (result.error === 'Member not found')
        throw new NotFoundException(result.error);
      throw new BadRequestException(result.error);
    }
    return { success: true };
  }
}
