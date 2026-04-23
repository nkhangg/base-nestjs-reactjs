import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
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
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
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
import { UpdateAdminRoleUseCase } from '../../application/use-cases/update-admin-role.use-case';
import { DeactivateAdminUseCase } from '../../application/use-cases/deactivate-admin.use-case';
import {
  parsePage,
  filterStr,
  filterBool,
  buildPaginated,
} from '../../../../shared/application/paginate';

// ── DTOs ─────────────────────────────────────────────────────────────────────

class CreateAdminDto {
  @ApiProperty({ example: 'newadmin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'editor', default: 'admin' })
  @IsOptional()
  @IsString()
  role?: string;
}

class UpdateAdminRoleDto {
  @ApiProperty({ example: 'editor' })
  @IsString()
  role: string;
}

// ── Pagination config (for Swagger docs) ─────────────────────────────────────

const ADMIN_PAGINATE_CONFIG = {
  sortableColumns: ['email', 'role', 'isActive', 'createdAt'],
  searchableColumns: ['email', 'role'],
  filterableColumns: {
    isActive: [FilterOperator.EQ],
    role: [FilterOperator.EQ],
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
    private readonly updateAdminRoleUseCase: UpdateAdminRoleUseCase,
    private readonly deactivateAdminUseCase: DeactivateAdminUseCase,
  ) {}

  @Post()
  @RequirePermission('admin-management', 'create')
  @ApiOperation({ summary: 'Tạo tài khoản admin mới' })
  @ApiBody({ type: CreateAdminDto })
  @ApiResponse({
    status: 201,
    description: 'Tạo admin thành công',
    schema: { example: { success: true, adminId: 'uuid' } },
  })
  @ApiResponse({ status: 400, description: 'Email đã tồn tại' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền write' })
  async createAdmin(@Body() dto: CreateAdminDto) {
    const result = await this.createAdminUseCase.execute({
      email: dto.email,
      password: dto.password,
      role: dto.role,
    });
    if (!result.ok) return { success: false, error: result.error };
    return { success: true, adminId: result.value.adminId };
  }

  @Get()
  @RequirePermission('admin-management', 'read')
  @ApiOperation({
    summary: 'Danh sách admin (hỗ trợ search, filter, sort, phân trang)',
  })
  @ApiPaginationQuery(ADMIN_PAGINATE_CONFIG)
  @ApiResponse({ status: 200, description: 'Danh sách admin phân trang' })
  async listAdmins(@Paginate() query: PaginateQuery) {
    const { page, limit, search, filter, sortBy } = parsePage(
      query,
      ADMIN_PAGINATE_CONFIG,
    );
    const { data, total } = await this.listAdminsUseCase.execute({
      page,
      pageSize: limit,
      search,
      sortBy: sortBy?.[0] as
        | 'email'
        | 'role'
        | 'isActive'
        | 'createdAt'
        | undefined,
      sortDir: sortBy?.[1]?.toLowerCase() as 'asc' | 'desc' | undefined,
      isActive: filterBool(filter, 'isActive'),
      role: filterStr(filter, 'role'),
    });

    return buildPaginated(
      data.map((a) => ({
        id: a.id.value,
        email: a.email,
        role: a.role,
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
  @ApiResponse({ status: 200, description: 'Thông tin admin' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy admin' })
  async getAdmin(@Param('id') id: string) {
    const result = await this.getAdminUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    const a = result.value;
    return {
      success: true,
      data: {
        id: a.id.value,
        email: a.email,
        role: a.role,
        isActive: a.isActive,
        createdAt: a.createdAt,
      },
    };
  }

  @Patch(':id/role')
  @RequirePermission('admin-management', 'update')
  @ApiOperation({ summary: 'Cập nhật role của admin' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @ApiBody({ type: UpdateAdminRoleDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async updateAdminRole(
    @Param('id') id: string,
    @Body() dto: UpdateAdminRoleDto,
  ) {
    const result = await this.updateAdminRoleUseCase.execute({
      adminId: id,
      role: dto.role,
    });
    if (!result.ok) return { success: false, error: result.error };
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermission('admin-management', 'delete')
  @ApiOperation({ summary: 'Vô hiệu hóa tài khoản admin' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @ApiResponse({ status: 200, description: 'Vô hiệu hóa thành công' })
  @ApiResponse({ status: 400, description: 'Không thể vô hiệu hóa chính mình' })
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
