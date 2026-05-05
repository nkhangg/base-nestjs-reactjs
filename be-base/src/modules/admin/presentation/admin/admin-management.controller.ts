import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  Patch,
  Post,
  Req,
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
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import {
  Paginate,
  type PaginateQuery,
  ApiPaginationQuery,
  FilterOperator,
} from 'nestjs-paginate';
import type { Request } from 'express';
import { AdminAuthGuard } from '../../../../core/admin-shell/admin-auth.guard';
import { RequirePermission } from '../../../../core/admin-shell/require-permission.decorator';
import { CreateAdminUseCase } from '../../application/use-cases/create-admin.use-case';
import { GetAdminUseCase } from '../../application/use-cases/get-admin.use-case';
import { ListAdminsUseCase } from '../../application/use-cases/list-admins.use-case';
import { SyncAdminRolesUseCase } from '../../application/use-cases/sync-admin-roles.use-case';
import { GetAdminRolesUseCase } from '../../application/use-cases/get-admin-roles.use-case';
import { DeactivateAdminUseCase } from '../../application/use-cases/deactivate-admin.use-case';
import { ActivateAdminUseCase } from '../../application/use-cases/activate-admin.use-case';
import { UpdateAdminInfoUseCase } from '../../application/use-cases/update-admin-info.use-case';
import { ResetAdminPasswordUseCase } from '../../application/use-cases/reset-admin-password.use-case';
import {
  parsePage,
  filterBool,
  buildPaginated,
} from '../../../../shared/application/paginate';
import { AuthorizationService } from '../../../../core/authorization';

// ── DTOs ─────────────────────────────────────────────────────────────────────

class CreateAdminDto {
  @ApiProperty({ example: 'newadmin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: ['admin'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}

class SyncAdminRolesDto {
  @ApiProperty({ example: ['editor', 'moderator'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}

class UpdateAdminInfoDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}

class ResetAdminPasswordDto {
  @ApiProperty({ example: 'NewPass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

// ── Pagination config ─────────────────────────────────────────────────────────

const ADMIN_PAGINATE_CONFIG = {
  sortableColumns: ['email', 'isActive', 'createdAt'],
  searchableColumns: ['email'],
  filterableColumns: {
    isActive: [FilterOperator.EQ],
  },
  defaultLimit: 20,
  maxLimit: 100,
};

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Admin Management')
@ApiCookieAuth('access_token')
@Controller('admin/management')
@UseGuards(AdminAuthGuard)
export class AdminManagementController {
  constructor(
    private readonly createAdminUseCase: CreateAdminUseCase,
    private readonly getAdminUseCase: GetAdminUseCase,
    private readonly listAdminsUseCase: ListAdminsUseCase,
    private readonly syncAdminRolesUseCase: SyncAdminRolesUseCase,
    private readonly getAdminRolesUseCase: GetAdminRolesUseCase,
    private readonly deactivateAdminUseCase: DeactivateAdminUseCase,
    private readonly activateAdminUseCase: ActivateAdminUseCase,
    private readonly updateAdminInfoUseCase: UpdateAdminInfoUseCase,
    private readonly resetAdminPasswordUseCase: ResetAdminPasswordUseCase,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Post()
  @RequirePermission('admin-management', 'create')
  @ApiOperation({ summary: 'Tạo tài khoản admin mới' })
  @ApiBody({ type: CreateAdminDto })
  async createAdmin(@Body() dto: CreateAdminDto) {
    const result = await this.createAdminUseCase.execute({
      email: dto.email,
      password: dto.password,
      roles: dto.roles,
    });
    if (!result.ok) return { success: false, error: result.error };
    return { success: true, adminId: result.value.adminId };
  }

  @Get()
  @RequirePermission('admin-management', 'read')
  @ApiOperation({ summary: 'Danh sách admin (search, filter, sort, phân trang)' })
  @ApiPaginationQuery(ADMIN_PAGINATE_CONFIG)
  async listAdmins(@Paginate() query: PaginateQuery) {
    const { page, limit, search, filter, sortBy } = parsePage(
      query,
      ADMIN_PAGINATE_CONFIG,
    );
    const { data, total } = await this.listAdminsUseCase.execute({
      page,
      pageSize: limit,
      search,
      sortBy: sortBy?.[0] as 'email' | 'isActive' | 'createdAt' | undefined,
      sortDir: sortBy?.[1]?.toLowerCase() as 'asc' | 'desc' | undefined,
      isActive: filterBool(filter, 'isActive'),
    });

    const adminIds = data.map((a) => a.id.value);
    const rolesMap = new Map<string, string[]>();
    await Promise.all(
      adminIds.map(async (id) => {
        const roles = await this.authorizationService.getAssignedRoleNames(
          id,
          'admin',
        );
        rolesMap.set(id, roles);
      }),
    );

    return buildPaginated(
      data.map((a) => ({
        id: a.id.value,
        email: a.email,
        name: a.name ?? null,
        phone: a.phone ?? null,
        avatarUrl: a.avatarUrl ?? null,
        roles: rolesMap.get(a.id.value) ?? [],
        isActive: a.isActive,
        createdAt: a.createdAt,
      })),
      total,
      query,
      ADMIN_PAGINATE_CONFIG,
    );
  }

  @Get(':id')
  @RequirePermission('admin-management', 'read')
  @ApiOperation({ summary: 'Lấy thông tin một admin' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  async getAdmin(@Param('id') id: string) {
    const result = await this.getAdminUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    const a = result.value;
    const roles = await this.authorizationService.getAssignedRoleNames(
      a.id.value,
      'admin',
    );
    return {
      success: true,
      data: {
        id: a.id.value,
        email: a.email,
        name: a.name ?? null,
        phone: a.phone ?? null,
        avatarUrl: a.avatarUrl ?? null,
        roles,
        isActive: a.isActive,
        createdAt: a.createdAt,
      },
    };
  }

  @Get(':id/roles')
  @RequirePermission('admin-management', 'read')
  @ApiOperation({ summary: 'Lấy danh sách roles của admin' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  async getAdminRoles(@Param('id') id: string) {
    const result = await this.getAdminRolesUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true, data: result.value };
  }

  @Put(':id/roles')
  @RequirePermission('admin-management', 'update')
  @ApiOperation({ summary: 'Đồng bộ roles của admin (set-based)' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @ApiBody({ type: SyncAdminRolesDto })
  async syncAdminRoles(
    @Param('id') id: string,
    @Body() dto: SyncAdminRolesDto,
  ) {
    const result = await this.syncAdminRolesUseCase.execute({
      adminId: id,
      roles: dto.roles,
    });
    if (!result.ok) return { success: false, error: result.error };
    return { success: true };
  }

  @Patch(':id/activate')
  @RequirePermission('admin-management', 'update')
  @ApiOperation({ summary: 'Kích hoạt lại tài khoản admin đã vô hiệu hóa' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  async activateAdmin(@Param('id') id: string) {
    const result = await this.activateAdminUseCase.execute(id);
    if (!result.ok) {
      if (result.error === 'ADMIN_NOT_FOUND')
        throw new NotFoundException('Admin không tồn tại');
      if (result.error === 'ADMIN_ALREADY_ACTIVE')
        throw new BadRequestException('Admin đã đang hoạt động');
      return { success: false, error: result.error };
    }
    return { success: true };
  }

  @Patch(':id')
  @RequirePermission('admin-management', 'update')
  @ApiOperation({ summary: 'Cập nhật thông tin admin (name, phone)' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @ApiBody({ type: UpdateAdminInfoDto })
  async updateAdminInfo(@Param('id') id: string, @Body() dto: UpdateAdminInfoDto) {
    const result = await this.updateAdminInfoUseCase.execute({
      adminId: id,
      name: dto.name,
      phone: dto.phone,
      avatarUrl: dto.avatarUrl,
    });
    if (!result.ok) {
      if (result.error === 'ADMIN_NOT_FOUND')
        throw new NotFoundException('Admin không tồn tại');
      return { success: false, error: result.error };
    }
    return { success: true };
  }

  @Patch(':id/password')
  @RequirePermission('admin-management', 'update')
  @ApiOperation({ summary: 'Đặt lại mật khẩu cho admin (admin privilege)' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @ApiBody({ type: ResetAdminPasswordDto })
  async resetAdminPassword(@Param('id') id: string, @Body() dto: ResetAdminPasswordDto) {
    const result = await this.resetAdminPasswordUseCase.execute({
      adminId: id,
      newPassword: dto.newPassword,
    });
    if (!result.ok) {
      if (result.error === 'ADMIN_NOT_FOUND')
        throw new NotFoundException('Admin không tồn tại');
      return { success: false, error: result.error };
    }
    return { success: true };
  }

  @Patch(':id/role')
  @RequirePermission('admin-management', 'update')
  @ApiOperation({ summary: 'Deprecated: dùng PUT :id/roles thay thế' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  async updateAdminRole(
    @Param('id') id: string,
    @Body() dto: { role: string },
  ) {
    const result = await this.syncAdminRolesUseCase.execute({
      adminId: id,
      roles: [dto.role],
    });
    if (!result.ok) return { success: false, error: result.error };
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermission('admin-management', 'delete')
  @ApiOperation({ summary: 'Vô hiệu hóa tài khoản admin' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  async deactivateAdmin(@Param('id') id: string, @Req() req: Request) {
    const requesterId = req.user?.userId ?? '';
    const result = await this.deactivateAdminUseCase.execute({
      adminId: id,
      requesterId,
    });
    if (!result.ok) {
      if (result.error === 'CANNOT_DEACTIVATE_SELF')
        throw new BadRequestException(
          'Không thể vô hiệu hóa tài khoản đang đăng nhập',
        );
      if (result.error === 'ADMIN_NOT_FOUND')
        throw new NotFoundException('Admin không tồn tại');
      return { success: false, error: result.error };
    }
    return { success: true };
  }
}
