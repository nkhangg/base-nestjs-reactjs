import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiBody,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { AuthGuard, Public } from '../../infrastructure/auth.guard';
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  COOKIE_SESSION_ID,
} from '../../infrastructure/refresh.middleware';
import { LoginDto } from './dtos/login.dto';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập, nhận cookie JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login thành công' })
  @ApiResponse({ status: 401, description: 'Sai email hoặc password' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
      type: dto.type,
      deviceName:
        dto.deviceName ?? (req.headers['x-device-name'] as string) ?? 'Unknown',
      ipAddress: req.ip ?? '',
      userAgent: req.headers['user-agent'] ?? '',
    });

    if (!result.ok) throw result.error;

    const { accessToken, refreshToken, sessionId } = result.value;

    res.cookie('access_token', accessToken, COOKIE_ACCESS);
    res.cookie('refresh_token', refreshToken, COOKIE_REFRESH);
    res.cookie('session_id', sessionId, COOKIE_SESSION_ID);

    return { message: 'Login successful' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Đăng xuất, xóa cookies' })
  @ApiResponse({ status: 204, description: 'Logout thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (!req.user) throw new UnauthorizedException();

    await this.logoutUseCase.execute({
      sessionId: req.user.sessionId,
      userId: req.user.userId,
    });

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.clearCookie('session_id');
  }

  @Get('me')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Lấy thông tin user đang đăng nhập' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin user hiện tại',
    schema: {
      example: {
        userId: 'uuid',
        sessionId: 'uuid',
        email: 'admin@example.com',
        adminRole: 'super-admin',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  getMe(@Req() req: Request) {
    if (!req.user) throw new UnauthorizedException();
    return req.user;
  }
}
