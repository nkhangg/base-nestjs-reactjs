import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiBody,
  ApiProperty,
  ApiPropertyOptional,
  ApiParam,
} from '@nestjs/swagger';
import { IsOptional, IsString, IsObject } from 'class-validator';
import {
  Paginate,
  type PaginateQuery,
  ApiPaginationQuery,
  FilterOperator,
} from 'nestjs-paginate';
import {
  parsePage,
  filterStr,
  buildPaginated,
} from '../../../../shared/application/paginate';
import { AdminAuthGuard } from '../../../../core/admin-shell/admin-auth.guard';
import { RequirePermission } from '../../../../core/admin-shell/require-permission.decorator';
import { ListRolesUseCase } from '../../application/use-cases/list-roles.use-case';
import { GetRoleUseCase } from '../../application/use-cases/get-role.use-case';
import { CreateRoleUseCase } from '../../application/use-cases/create-role.use-case';
import { UpdateRoleUseCase } from '../../application/use-cases/update-role.use-case';
import { DeleteRoleUseCase } from '../../application/use-cases/delete-role.use-case';
import { AuthorizationService } from '../../../../core/authorization';
import type { SubjectType, Action } from '../../../../core/authorization';
import type { Role } from '../../../../core/authorization/domain/entities/role.entity';

// ── Paginate config ───────────────────────────────────────────────────────────

const ROLE_PAGINATE_CONFIG = {
  sortableColumns: ['name', 'subjectType'],
  searchableColumns: ['name', 'description'],
  filterableColumns: {
    subjectType: [FilterOperator.EQ],
  },
  defaultLimit: 20,
  maxLimit: 100,
};

// ── DTOs ─────────────────────────────────────────────────────────────────────

class CreateRoleDto {
  @ApiProperty({ example: 'content-editor' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'admin', enum: ['admin', 'user', 'merchant', '*'] })
  @IsString()
  subjectType: SubjectType;

  @ApiPropertyOptional({ example: 'Can create and edit content' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'role-uuid-of-viewer' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({
    example: { products: ['create', 'read', 'update'] },
    description:
      'Map of resource → actions. Use "*" as resource for all resources.',
  })
  @IsObject()
  permissions: Record<string, Action[]>;
}

class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'role-uuid', nullable: true })
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiPropertyOptional({
    example: { products: ['create', 'read', 'update'] },
    description:
      'Replaces all existing permissions. Omit to keep current permissions.',
  })
  @IsOptional()
  @IsObject()
  permissions?: Record<string, Action[]>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapRole(r: Role) {
  return {
    id: r.id,
    name: r.name,
    subjectType: r.subjectType,
    description: r.description,
    parentId: r.parentId ?? null,
  };
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Role Management')
@ApiCookieAuth('access_token')
@Controller('admin/roles')
@UseGuards(AdminAuthGuard)
export class RoleManagementController {
  constructor(
    private readonly listRolesUseCase: ListRolesUseCase,
    private readonly getRoleUseCase: GetRoleUseCase,
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Get()
  @RequirePermission('role-management', 'read')
  @ApiOperation({
    summary: 'Danh sách roles (hỗ trợ search, filter, phân trang)',
  })
  @ApiPaginationQuery(ROLE_PAGINATE_CONFIG)
  @ApiResponse({ status: 200, description: 'Danh sách roles phân trang' })
  async listRoles(@Paginate() query: PaginateQuery) {
    const { page, limit, search, filter } = parsePage(
      query,
      ROLE_PAGINATE_CONFIG,
    );
    const { data, total } = await this.listRolesUseCase.execute({
      subjectType: filterStr(filter, 'subjectType') as SubjectType | undefined,
      search,
      page,
      pageSize: limit,
    });

    return buildPaginated(
      data.map(mapRole),
      total,
      query,
      ROLE_PAGINATE_CONFIG,
    );
  }

  @Get('resources')
  @RequirePermission('role-management', 'read')
  @ApiOperation({
    summary: 'Danh sách resource names đang dùng trong hệ thống',
  })
  @ApiResponse({ status: 200, description: 'Danh sách resources' })
  async listResources() {
    const resources = await this.authorizationService.listAllResources();
    return { success: true, data: resources };
  }

  @Get(':id')
  @RequirePermission('role-management', 'read')
  @ApiOperation({ summary: 'Chi tiết role kèm permissions' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết role' })
  @ApiResponse({ status: 404, description: 'Role không tồn tại' })
  async getRole(@Param('id') id: string) {
    const result = await this.getRoleUseCase.execute(id);
    if (!result.ok) throw new NotFoundException('Role không tồn tại');
    const { role: r, permissions } = result.value;
    return {
      success: true,
      data: {
        ...mapRole(r),
        permissions: permissions.map((p) => ({
          id: p.id,
          resource: p.resource,
          actions: p.actions,
        })),
      },
    };
  }

  @Post()
  @RequirePermission('role-management', 'create')
  @ApiOperation({ summary: 'Tạo role mới' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: 'Tạo role thành công' })
  @ApiResponse({ status: 409, description: 'Role đã tồn tại' })
  async createRole(@Body() dto: CreateRoleDto) {
    const result = await this.createRoleUseCase.execute({
      name: dto.name,
      subjectType: dto.subjectType,
      description: dto.description,
      parentId: dto.parentId,
      permissions: dto.permissions,
    });
    if (!result.ok) {
      if (result.error === 'ROLE_ALREADY_EXISTS')
        throw new ConflictException('Role đã tồn tại');
      if (result.error === 'PARENT_NOT_FOUND')
        throw new BadRequestException('Parent role không tồn tại');
    }
    return {
      success: true,
      roleId: result.ok ? result.value.roleId : undefined,
    };
  }

  @Patch(':id')
  @RequirePermission('role-management', 'update')
  @ApiOperation({ summary: 'Cập nhật role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Role không tồn tại' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    const result = await this.updateRoleUseCase.execute({
      roleId: id,
      description: dto.description,
      parentId: dto.parentId,
      permissions: dto.permissions,
    });
    if (!result.ok) {
      if (result.error === 'ROLE_NOT_FOUND')
        throw new NotFoundException('Role không tồn tại');
      if (result.error === 'PARENT_NOT_FOUND')
        throw new BadRequestException('Parent role không tồn tại');
      if (result.error === 'CIRCULAR_HIERARCHY')
        throw new BadRequestException('Tạo vòng lặp trong cây phân cấp role');
    }
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermission('role-management', 'delete')
  @ApiOperation({ summary: 'Xóa role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Role không tồn tại' })
  async deleteRole(@Param('id') id: string) {
    const result = await this.deleteRoleUseCase.execute(id);
    if (!result.ok) throw new NotFoundException('Role không tồn tại');
    return { success: true };
  }
}
