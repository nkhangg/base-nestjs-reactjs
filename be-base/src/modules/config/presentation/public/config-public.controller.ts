import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../core/auth';
import { GetConfigByKeyUseCase } from '../../application/use-cases/get-config-by-key.use-case';
import { GetConfigsBatchUseCase } from '../../application/use-cases/get-configs-batch.use-case';

const PUBLIC_SCOPES = ['public'] as const;

@ApiTags('Configs (Public)')
@Controller('configs')
export class ConfigPublicController {
  constructor(
    private readonly getConfigByKeyUseCase: GetConfigByKeyUseCase,
    private readonly getConfigsBatchUseCase: GetConfigsBatchUseCase,
  ) {}

  @Get('batch')
  @Public()
  @ApiOperation({ summary: 'Batch đọc nhiều config public' })
  @ApiQuery({ name: 'keys', description: 'Comma-separated config keys', example: 'homepage.hero,footer.links' })
  async batchGet(@Query('keys') keys: string) {
    const keyList = (keys ?? '').split(',').map((k) => k.trim()).filter(Boolean);
    if (keyList.length === 0) return {};
    return this.getConfigsBatchUseCase.execute({
      keys: keyList,
      allowedScopes: [...PUBLIC_SCOPES],
    });
  }

  @Get(':key')
  @Public()
  @ApiOperation({ summary: 'Đọc 1 config public theo key' })
  @ApiParam({ name: 'key', example: 'homepage.hero' })
  async getByKey(@Param('key') key: string) {
    const result = await this.getConfigByKeyUseCase.execute({
      key,
      allowedScopes: [...PUBLIC_SCOPES],
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
