import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAuthGuard } from '../../../../core/admin-shell/admin-auth.guard';
import { RequirePermission } from '../../../../core/admin-shell/require-permission.decorator';
import {
  ORGANIZATION_REPOSITORY,
  type IOrganizationRepository,
} from '../../domain/repositories/organization.repository';
import {
  CLASSROOM_REPOSITORY,
  type IClassroomRepository,
} from '../../domain/repositories/classroom.repository';
import { AdminListOrganizationsUseCase } from '../../application/use-cases/admin-list-organizations.use-case';
import { AdminDeleteOrganizationUseCase } from '../../application/use-cases/admin-delete-organization.use-case';
import { AdminListClassroomsByOrgUseCase } from '../../application/use-cases/admin-list-classrooms-by-org.use-case';
import { AdminListMembersUseCase } from '../../application/use-cases/admin-list-members.use-case';
import { AdminRemoveMemberUseCase } from '../../application/use-cases/admin-remove-member.use-case';
import type { Organization } from '../../domain/entities/organization.entity';
import type { Classroom } from '../../domain/entities/classroom.entity';

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

@ApiTags('Organization (Admin)')
@ApiCookieAuth('access_token')
@UseGuards(AdminAuthGuard)
@Controller()
export class AdminOrganizationController {
  constructor(
    private readonly listOrgsUseCase: AdminListOrganizationsUseCase,
    private readonly deleteOrgUseCase: AdminDeleteOrganizationUseCase,
    private readonly listClassroomsUseCase: AdminListClassroomsByOrgUseCase,
    private readonly listMembersUseCase: AdminListMembersUseCase,
    private readonly removeMemberUseCase: AdminRemoveMemberUseCase,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly orgRepo: IOrganizationRepository,
    @Inject(CLASSROOM_REPOSITORY)
    private readonly classroomRepo: IClassroomRepository,
  ) {}

  // ── Organizations ─────────────────────────────────────────────────────────

  @Get('admin/organizations')
  @RequirePermission('organization-management', 'read')
  @ApiOperation({ summary: 'List all organizations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async listOrganizations(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const { data, total } = await this.listOrgsUseCase.execute({
      page: page ? Number(page) : 1,
      pageSize: limit ? Number(limit) : 20,
      search,
    });
    return { data: data.map(orgToJson), total };
  }

  @Get('admin/organizations/:id')
  @RequirePermission('organization-management', 'read')
  @ApiOperation({ summary: 'Get organization by ID' })
  async getOrganization(@Param('id') id: string) {
    const org = await this.orgRepo.findById(id);
    if (!org) throw new NotFoundException('Organization not found');
    return orgToJson(org);
  }

  @Delete('admin/organizations/:id')
  @HttpCode(200)
  @RequirePermission('organization-management', 'delete')
  @ApiOperation({
    summary: 'Delete an organization (cascades to classrooms + members)',
  })
  async deleteOrganization(@Param('id') id: string) {
    const result = await this.deleteOrgUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }

  // ── Classrooms ────────────────────────────────────────────────────────────

  @Get('admin/organizations/:orgId/classrooms')
  @RequirePermission('organization-management', 'read')
  @ApiOperation({ summary: 'List classrooms of an organization' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listClassrooms(
    @Param('orgId') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const { data, total } = await this.listClassroomsUseCase.execute({
      orgId,
      page: page ? Number(page) : 1,
      pageSize: limit ? Number(limit) : 50,
    });
    return { data: data.map(classroomToJson), total };
  }

  @Get('admin/classrooms/:id/members')
  @RequirePermission('organization-management', 'read')
  @ApiOperation({ summary: 'List members of a classroom with profiles' })
  async listMembers(@Param('id') id: string) {
    const members = await this.listMembersUseCase.execute(id);
    return { data: members };
  }

  @Get('admin/classrooms/:id/report')
  @RequirePermission('organization-management', 'read')
  @ApiOperation({ summary: 'Get classroom member progress report' })
  async getClassroomReport(@Param('id') id: string) {
    const classroom = await this.classroomRepo.findById(id);
    if (!classroom) throw new NotFoundException('Classroom not found');
    const members = await this.listMembersUseCase.execute(id);
    return {
      classroomId: id,
      classroomName: classroom.name,
      data: members,
    };
  }

  @Delete('admin/classrooms/:classroomId/members/:userId')
  @HttpCode(200)
  @RequirePermission('organization-management', 'delete')
  @ApiOperation({ summary: 'Remove a member from a classroom' })
  async removeMember(
    @Param('classroomId') classroomId: string,
    @Param('userId') userId: string,
  ) {
    const result = await this.removeMemberUseCase.execute(classroomId, userId);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }
}
