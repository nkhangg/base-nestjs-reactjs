import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Optional,
  Param,
  Patch,
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
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { AuthGuard, Public } from '../../infrastructure/auth.guard';
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  COOKIE_SESSION_ID,
} from '../../infrastructure/refresh.middleware';
import { Throttle } from '@nestjs/throttler';
import { LoginDto } from './dtos/login.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { AuthorizationService, Subject } from '../../../authorization';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../domain/repositories/session.repository';

const ADMIN_NAV_RESOURCES = [
  'admin-management',
  'role-management',
  'user-management',
  'config-management',
  'media-management',
  'notification-management',
  'audit-logs',
  'blog-management',
] as const;

@ApiTags('Auth')
@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Optional() private readonly authorizationService: AuthorizationService,
  ) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
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

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Đổi mật khẩu (yêu cầu đăng nhập)' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 204, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Mật khẩu hiện tại không đúng' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ): Promise<void> {
    if (!req.user) throw new UnauthorizedException();

    const result = await this.changePasswordUseCase.execute({
      userId: req.user.userId,
      userType: req.user.type,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });

    if (!result.ok) {
      if (result.error === 'wrong_password')
        throw new BadRequestException('Mật khẩu hiện tại không đúng');
      throw new BadRequestException('Không tìm thấy tài khoản');
    }
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Yêu cầu reset mật khẩu' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Trả về token reset (sẽ gửi qua email khi có mailer)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.forgotPasswordUseCase.execute({
      email: dto.email,
      type: dto.type,
    });
    // Always return 200 regardless of whether email exists (security)
    // token is empty string when email not found
    return {
      message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn reset mật khẩu',
      // TODO: remove token from response once mailer is implemented
      ...(result.token ? { token: result.token } : {}),
    };
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Đặt lại mật khẩu bằng token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 204, description: 'Đặt lại mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Token không hợp lệ hoặc đã hết hạn' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    const result = await this.resetPasswordUseCase.execute({
      token: dto.token,
      newPassword: dto.newPassword,
    });

    if (!result.ok) {
      if (result.error === 'token_expired')
        throw new BadRequestException('Token đã hết hạn');
      throw new BadRequestException('Token không hợp lệ');
    }
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
  async getMe(@Req() req: Request) {
    if (!req.user) throw new UnauthorizedException();

    const user = req.user;
    if (!user.isAdmin || !this.authorizationService) return user;

    const subject = Subject.of(user.userId, 'admin');
    const results = await Promise.all(
      ADMIN_NAV_RESOURCES.map((r) => this.authorizationService.can(subject, r, 'read')),
    );
    const accessibleResources = ADMIN_NAV_RESOURCES.filter((_, i) => results[i]);

    return { ...user, accessibleResources };
  }

  @Get('profile')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Lấy profile đầy đủ của account đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Profile data' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getProfile(@Req() req: Request) {
    if (!req.user) throw new UnauthorizedException();

    return this.getProfileUseCase.execute({
      userId: req.user.userId,
      type: req.user.type,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
    });
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Cập nhật profile (name, phone, avatarUrl)' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile đã được cập nhật' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: Request) {
    if (!req.user) throw new UnauthorizedException();

    return this.updateProfileUseCase.execute({
      userId: req.user.userId,
      type: req.user.type,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
      data: { name: dto.name, phone: dto.phone, avatarUrl: dto.avatarUrl },
    });
  }

  @Get('sessions')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Danh sách sessions đang hoạt động của account hiện tại' })
  @ApiResponse({ status: 200, description: 'Sessions list' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getSessions(@Req() req: Request) {
    if (!req.user) throw new UnauthorizedException();

    const sessions = await this.sessionRepo.findByUserId(req.user.userId, true);
    return sessions.map((s) => ({
      id: s.id,
      deviceName: s.deviceInfo.deviceName,
      ipAddress: s.deviceInfo.ipAddress,
      userAgent: s.deviceInfo.userAgent,
      isActive: s.isActive,
      lastActiveAt: s.lastActiveAt,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
    }));
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Thu hồi một session (không thể thu hồi session hiện tại)' })
  @ApiResponse({ status: 204, description: 'Session đã bị thu hồi' })
  @ApiResponse({ status: 403, description: 'Không thể thu hồi session hiện tại hoặc session không thuộc về bạn' })
  @ApiResponse({ status: 404, description: 'Session không tồn tại' })
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @Req() req: Request,
  ): Promise<void> {
    if (!req.user) throw new UnauthorizedException();

    if (sessionId === req.user.sessionId) {
      throw new ForbiddenException('Không thể thu hồi session hiện tại. Vui lòng dùng logout.');
    }

    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new NotFoundException('Session không tồn tại');

    if (session.userId !== req.user.userId) {
      throw new ForbiddenException('Không có quyền thu hồi session này');
    }

    session.revoke();
    await this.sessionRepo.save(session);
  }
}
