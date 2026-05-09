import {
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
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  ApiPaginationQuery,
  FilterOperator,
  Paginate,
  type PaginateQuery,
} from 'nestjs-paginate';
import { AdminAuthGuard } from '../../../../core/admin-shell/admin-auth.guard';
import { RequirePermission } from '../../../../core/admin-shell/require-permission.decorator';
import {
  buildPaginated,
  filterStr,
  parsePage,
} from '../../../../shared/application/paginate';
import { DeleteContactUseCase } from '../../application/use-cases/delete-contact.use-case';
import { GetContactUseCase } from '../../application/use-cases/get-contact.use-case';
import { ListContactsUseCase } from '../../application/use-cases/list-contacts.use-case';
import { ReplyToContactUseCase } from '../../application/use-cases/reply-to-contact.use-case';
import { UpdateContactStatusUseCase } from '../../application/use-cases/update-contact-status.use-case';
import type { Contact, ContactStatus } from '../../domain/entities/contact.entity';

class ReplyContactDto {
  @ApiProperty({ description: 'Nội dung trả lời gửi tới khách hàng' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  replyMessage!: string;
}

class UpdateContactStatusDto {
  @ApiProperty({ enum: ['PENDING', 'READ', 'RESPONDED', 'CLOSED'] })
  @IsEnum(['PENDING', 'READ', 'RESPONDED', 'CLOSED'])
  status!: ContactStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

const CONTACT_PAGINATE_CONFIG = {
  sortableColumns: ['createdAt', 'updatedAt'],
  searchableColumns: ['firstName', 'lastName', 'email', 'subject'],
  filterableColumns: {
    status: [FilterOperator.EQ],
  },
  defaultLimit: 20,
  maxLimit: 100,
};

function mapContact(c: Contact) {
  return {
    id: c.id.value,
    firstName: c.firstName,
    lastName: c.lastName,
    fullName: c.fullName,
    email: c.email,
    phone: c.phone,
    subject: c.subject,
    message: c.message,
    status: c.status,
    note: c.note,
    replyMessage: c.replyMessage,
    respondedAt: c.respondedAt,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

@ApiTags('Contacts Management')
@ApiCookieAuth('access_token')
@Controller('admin/contacts')
@UseGuards(AdminAuthGuard)
export class ContactsAdminController {
  constructor(
    private readonly listUseCase: ListContactsUseCase,
    private readonly getUseCase: GetContactUseCase,
    private readonly updateStatusUseCase: UpdateContactStatusUseCase,
    private readonly replyUseCase: ReplyToContactUseCase,
    private readonly deleteUseCase: DeleteContactUseCase,
  ) {}

  @Get()
  @RequirePermission('contacts', 'read')
  @ApiOperation({ summary: 'Danh sách liên hệ (search, filter, phân trang)' })
  @ApiPaginationQuery(CONTACT_PAGINATE_CONFIG)
  async list(@Paginate() query: PaginateQuery) {
    const { page, limit, search, filter, sortBy } = parsePage(
      query,
      CONTACT_PAGINATE_CONFIG,
    );
    const { data, total } = await this.listUseCase.execute({
      page,
      pageSize: limit,
      search,
      status: filterStr(filter, 'status') as ContactStatus | undefined,
      sortBy: sortBy?.[0] as 'createdAt' | 'updatedAt' | undefined,
      sortDir: sortBy?.[1]?.toLowerCase() as 'asc' | 'desc' | undefined,
    });
    return buildPaginated(data.map(mapContact), total, query, CONTACT_PAGINATE_CONFIG);
  }

  @Get(':id')
  @RequirePermission('contacts', 'read')
  @ApiOperation({ summary: 'Chi tiết liên hệ' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  async getOne(@Param('id') id: string) {
    const result = await this.getUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true, data: mapContact(result.value) };
  }

  @Patch(':id')
  @RequirePermission('contacts', 'update')
  @ApiOperation({ summary: 'Cập nhật trạng thái liên hệ' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiBody({ type: UpdateContactStatusDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContactStatusDto,
  ) {
    const result = await this.updateStatusUseCase.execute({
      id,
      status: dto.status,
      note: dto.note,
    });
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true, data: mapContact(result.value) };
  }

  @Post(':id/reply')
  @RequirePermission('contacts', 'update')
  @ApiOperation({ summary: 'Trả lời liên hệ — gửi email tới khách hàng và cập nhật trạng thái RESPONDED' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiBody({ type: ReplyContactDto })
  async reply(
    @Param('id') id: string,
    @Body() dto: ReplyContactDto,
  ) {
    const result = await this.replyUseCase.execute({
      id,
      replyMessage: dto.replyMessage,
    });
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true, data: mapContact(result.value) };
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermission('contacts', 'delete')
  @ApiOperation({ summary: 'Xóa liên hệ' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  async remove(@Param('id') id: string) {
    const result = await this.deleteUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error);
    return { success: true };
  }
}
