import { Injectable, NestMiddleware, Inject, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction, CookieOptions } from 'express';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import {
  TOKEN_SERVICE,
  type ITokenService,
} from '../domain/services/token.service';

export const COOKIE_ACCESS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000, // 15 phút
};

export const COOKIE_REFRESH: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
};

export const COOKIE_SESSION_ID: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

@Injectable()
export class RefreshMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RefreshMiddleware.name);

  constructor(
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // JwtMiddleware đã gắn user thành công → không cần refresh
    if (req.user) return next();

    const refreshToken = req.cookies?.['refresh_token'] as string | undefined;
    const sessionId = req.cookies?.['session_id'] as string | undefined;
    const expiredAccessToken = req.cookies?.['access_token'] as
      | string
      | undefined;

    if (!refreshToken || !sessionId) return next();

    const result = await this.refreshTokenUseCase.execute({
      sessionId,
      refreshToken,
      expiredAccessToken: expiredAccessToken ?? '',
    });

    if (!result.ok) {
      // Refresh thất bại → clear hết, buộc login lại
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      res.clearCookie('session_id');
      return next();
    }

    const { accessToken, refreshToken: newRefreshToken } = result.value;

    // Ghi cookie mới — client không thấy gì xảy ra
    res.cookie('access_token', accessToken, COOKIE_ACCESS);
    res.cookie('refresh_token', newRefreshToken, COOKIE_REFRESH);

    // Gắn user vào request để controller dùng được trong request này luôn
    try {
      const payload = this.tokenService.verifyAccessToken(accessToken);
      req.user = {
        userId: payload.sub,
        sessionId: payload.sessionId,
        email: payload.email,
        type: payload.type,
        adminRole: payload.adminRole,
      };
    } catch (e) {
      this.logger.warn('Failed to verify refreshed access token', e);
    }

    next();
  }
}
