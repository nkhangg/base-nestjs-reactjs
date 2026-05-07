import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiBody,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { CreateDictionaryEntryUseCase } from '../../application/use-cases/create-dictionary-entry.use-case';

// ── DTO ───────────────────────────────────────────────────────────────────────

class SubmitEntryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  kanji?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  hiragana!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  romaji!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  meanings!: string[];

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  jlptLevel?: number;
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Dictionary (User)')
@ApiCookieAuth('access_token')
@Controller('me/dictionary')
export class DictionaryUserController {
  constructor(private readonly createUseCase: CreateDictionaryEntryUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Gửi từ điển entry mới (→ pending, chờ duyệt)' })
  @ApiBody({ type: SubmitEntryDto })
  async submit(
    @Body() dto: SubmitEntryDto,
    @Request() req: { user?: { userId?: string } },
  ) {
    const result = await this.createUseCase.execute({
      ...dto,
      creatorId: req.user?.userId,
      isStaff: false,
    });
    if (!result.ok) throw new BadRequestException(result.error);
    return { success: true, entryId: result.value.entryId };
  }
}
