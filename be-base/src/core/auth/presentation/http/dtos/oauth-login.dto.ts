import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class OAuthLoginDto {
  @ApiProperty({
    example: 'google',
    description: 'OAuth provider (google, discord, ...)',
  })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ description: 'Access token nhận được từ OAuth provider' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({
    example: 'user',
    description: 'Loại tài khoản muốn đăng nhập',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ example: 'Chrome / macOS' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}
