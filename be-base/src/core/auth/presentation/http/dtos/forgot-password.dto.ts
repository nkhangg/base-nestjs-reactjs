import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'admin',
    description: "Loại tài khoản: 'admin' | 'user'",
  })
  @IsString()
  type: string;
}
