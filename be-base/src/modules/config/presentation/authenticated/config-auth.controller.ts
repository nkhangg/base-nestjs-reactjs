import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  UserPermissionGuard,
  Permission,
} from '../../../../core/authorization';
import { GetConfigByKeyUseCase } from '../../application/use-cases/get-config-by-key.use-case';
import { GetConfigsBatchUseCase } from '../../application/use-cases/get-configs-batch.use-case';

const AUTH_SCOPES = ['public', 'members'] as const;

@ApiTags('Configs (Authenticated)')
@ApiCookieAuth('access_token')
@Controller('configs/me')
@UseGuards(UserPermissionGuard)
@Permission('configs', 'read')
export class ConfigAuthController {
  constructor(
    private readonly getConfigByKeyUseCase: GetConfigByKeyUseCase,
    private readonly getConfigsBatchUseCase: GetConfigsBatchUseCase,
  ) {}

  @Get('batch')
  @ApiOperation({ summary: 'Batch đọc config cho user đã đăng nhập' })
  @ApiQuery({ name: 'keys', description: 'Comma-separated keys', example: 'user.dashboard-layout,app.features' })
  async batchGet(@Query('keys') keys: string) {
    const keyList = (keys ?? '').split(',').map((k) => k.trim()).filter(Boolean);
    if (keyList.length === 0) return {};
    return this.getConfigsBatchUseCase.execute({
      keys: keyList,
      allowedScopes: [...AUTH_SCOPES],
    });
  }

  @Get(':key')
  @ApiOperation({ summary: 'Đọc config (public + authenticated scope) khi đã đăng nhập' })
  @ApiParam({ name: 'key', example: 'user.dashboard-layout' })
  async getByKey(@Param('key') key: string) {
    const result = await this.getConfigByKeyUseCase.execute({
      key,
      allowedScopes: [...AUTH_SCOPES],
    });
    if (!result.ok) throw new NotFoundException('Config not found');
    const c = result.value;
    return {
      key: c.key.value,
      value: c.value,
      scope: c.scope,
      tags: c.tags,
    };
  }
}
