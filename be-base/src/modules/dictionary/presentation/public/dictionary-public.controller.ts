import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../../../core/auth/infrastructure/auth.guard';
import {
  Paginate,
  type PaginateQuery,
  ApiPaginationQuery,
} from 'nestjs-paginate';
import {
  parsePage,
  buildPaginated,
} from '../../../../shared/application/paginate';
import { SearchDictionaryUseCase } from '../../application/use-cases/search-dictionary.use-case';
import { GetDictionaryEntryUseCase } from '../../application/use-cases/get-dictionary-entry.use-case';
import type { DictionaryEntry } from '../../domain/entities/dictionary-entry.entity';

const PUBLIC_PAGINATE_CONFIG = {
  sortableColumns: ['hiragana', 'jlptLevel', 'createdAt'],
  searchableColumns: ['hiragana', 'romaji', 'kanji'],
  filterableColumns: {},
  defaultLimit: 20,
  maxLimit: 100,
};

function mapPublicEntry(e: DictionaryEntry) {
  return {
    id: e.id.value,
    kanji: e.kanji,
    hiragana: e.hiragana,
    romaji: e.romaji,
    meanings: e.meanings,
    jlptLevel: e.jlptLevel,
    createdAt: e.createdAt,
  };
}

@ApiTags('Dictionary (Public)')
@Controller('dictionary')
export class DictionaryPublicController {
  constructor(
    private readonly searchUseCase: SearchDictionaryUseCase,
    private readonly getUseCase: GetDictionaryEntryUseCase,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Tìm kiếm từ điển (q, jlptLevel, phân trang)' })
  @ApiPaginationQuery(PUBLIC_PAGINATE_CONFIG)
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'jlptLevel', required: false, type: Number })
  async search(
    @Paginate() query: PaginateQuery,
    @Query('q') q?: string,
    @Query('jlptLevel') jlptLevel?: string,
  ) {
    const { page, limit } = parsePage(query, PUBLIC_PAGINATE_CONFIG);
    const { data, total } = await this.searchUseCase.execute({
      query: q,
      jlptLevel: jlptLevel ? parseInt(jlptLevel, 10) : undefined,
      page,
      pageSize: limit,
    });
    return buildPaginated(
      data.map(mapPublicEntry),
      total,
      query,
      PUBLIC_PAGINATE_CONFIG,
    );
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Chi tiết entry theo ID' })
  @ApiParam({ name: 'id', description: 'Entry ID' })
  async getOne(@Param('id') id: string) {
    const result = await this.getUseCase.execute(id);
    if (!result.ok) throw new NotFoundException('Entry not found');
    const entry = result.value;
    if (entry.status !== 'approved' || !entry.isPublic)
      throw new NotFoundException('Entry not found');
    return { success: true, data: mapPublicEntry(entry) };
  }
}
