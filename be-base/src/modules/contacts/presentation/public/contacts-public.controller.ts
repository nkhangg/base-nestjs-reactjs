import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../../core/auth/infrastructure/auth.guard';
import { SubmitContactUseCase } from '../../application/use-cases/submit-contact.use-case';

class SubmitContactDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message!: string;

  @ApiPropertyOptional({ description: 'Leave this field empty' })
  @IsOptional()
  @IsEmpty({ message: 'Bot detected' })
  website?: string;
}

@ApiTags('Contacts')
@Controller('contacts')
export class ContactsPublicController {
  constructor(private readonly submitUseCase: SubmitContactUseCase) {}

  @Post()
  @Public()
  @HttpCode(201)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Gửi form liên hệ (public)' })
  @ApiBody({ type: SubmitContactDto })
  async submit(@Body() dto: SubmitContactDto) {
    const result = await this.submitUseCase.execute({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      subject: dto.subject,
      message: dto.message,
    });
    return { success: true, contactId: result.contactId };
  }
}
