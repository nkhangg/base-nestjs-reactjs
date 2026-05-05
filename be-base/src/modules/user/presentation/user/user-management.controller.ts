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
import { AdminAuthGuard } from '../../../../core/admin-shell/admin-auth.guard';
import { RequirePermission } from '../../../../core/admin-shell/require-permission.decorator';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { GetUserUseCase } from '../../application/use-cases/get-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { UpdateUserRoleUseCase } from '../../application/use-cases/update-user-role.use-case';
import { UpdateUserInfoUseCase } from '../../application/use-cases/update-user-info.use-case';
import { DeactivateUserUseCase } from '../../application/use-cases/deactivate-user.use-case';
import { ActivateUserUseCase } from '../../application/use-cases/activate-user.use-case';
import {
  parsePage,
  filterStr,
  filterBool,
  filterDateRange,
  buildPaginated,
} from '../../../../shared/application/paginate';

// ── DTOs ─────────────────────────────────────────────────────────────────────

class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: 'member', default: 'member' })
  @IsOptional()
  @IsString()
  role?: string;
}

class UpdateUserRoleDto {
  @ApiProperty({ example: 'premium' })
  @IsString()
  role!: string;
}

class UpdateUserInfoDto {
  @ApiPropertyOptional({ example: 'newemail@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

// ── Pagination config ─────────────────────────────────────────────────────────

const USER_PAGINATE_CONFIG = {
  sortableColumns: ['email', 'role', 'isActive', 'createdAt'],
  searchableColumns: ['email'],
  filterableColumns: {
    isActive: [FilterOperator.EQ],
    role: [FilterOperator.EQ],
    createdAt: [FilterOperator.GTE, FilterOperator.LTE],
  },
  defaultLimit: 20,
  maxLimit: 100,
};

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('User Management')
@ApiCookieAuth('access_token')
@Controller('admin/users')
@UseGuards(AdminAuthGuard)
export class UserManagementController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly updateUserRoleUseCase: UpdateUserRoleUseCase,
    private readonly updateUserInfoUseCase: UpdateUserInfoUseCase,
    private readonly deactivateUserUseCase: DeactivateUserUseCase,
    private readonly activateUserUseCase: ActivateUserUseCase,
  ) {}

  @Post()
  @RequirePermission('user-management', 'create')
  @ApiOperation({ summary: 'Tạo tài khoản user mới' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    schema: { example: { success: true, userId: 'uuid' } },
  })
  @ApiResponse({ status: 400, description: 'Email đã tồn tại' })
  async createUser(@Body() dto: CreateUserDto) {
    const result = await this.createUserUseCase.execute({
      email: dto.email,
      password: dto.password,
      role: dto.role,
    });
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true, userId: result.value.userId };
  }

  @Get()
  @RequirePermission('user-management', 'read')
  @ApiOperation({
    summary: 'Danh sách users (search, filter, sort, phân trang)',
  })
  @ApiPaginationQuery(USER_PAGINATE_CONFIG)
  async listUsers(@Paginate() query: PaginateQuery) {
    const { page, limit, search, filter, sortBy } = parsePage(
      query,
      USER_PAGINATE_CONFIG,
    );
    const { from: createdAtFrom, to: createdAtTo } = filterDateRange(
      filter,
      'createdAt',
    );
    const { data, total } = await this.listUsersUseCase.execute({
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
      createdAtFrom,
      createdAtTo,
    });

    return buildPaginated(
      data.map((u) => ({
        id: u.id.value,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
      total,
      query,
      USER_PAGINATE_CONFIG,
    );
  }

  @Get(':id')
  @RequirePermission('user-management', 'read')
  @ApiOperation({ summary: 'Lấy thông tin một user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async getUser(@Param('id') id: string) {
    const result = await this.getUserUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    const u = result.value;
    return {
      success: true,
      data: {
        id: u.id.value,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      },
    };
  }

  @Patch(':id')
  @RequirePermission('user-management', 'update')
  @ApiOperation({ summary: 'Cập nhật thông tin user (email)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserInfoDto })
  async updateUserInfo(
    @Param('id') id: string,
    @Body() dto: UpdateUserInfoDto,
  ) {
    const result = await this.updateUserInfoUseCase.execute({
      userId: id,
      email: dto.email,
    });
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true };
  }

  @Patch(':id/role')
  @RequirePermission('user-management', 'update')
  @ApiOperation({ summary: 'Cập nhật role của user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserRoleDto })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    const result = await this.updateUserRoleUseCase.execute({
      userId: id,
      role: dto.role,
    });
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true };
  }

  @Patch(':id/activate')
  @HttpCode(200)
  @RequirePermission('user-management', 'update')
  @ApiOperation({ summary: 'Kích hoạt lại tài khoản user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async activateUser(@Param('id') id: string) {
    const result = await this.activateUserUseCase.execute({ userId: id });
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermission('user-management', 'delete')
  @ApiOperation({ summary: 'Vô hiệu hóa tài khoản user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async deactivateUser(@Param('id') id: string) {
    const result = await this.deactivateUserUseCase.execute({ userId: id });
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true };
  }
}
