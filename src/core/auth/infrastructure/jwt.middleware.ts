import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import {
  TOKEN_SERVICE,
  type ITokenService,
} from '../domain/services/token.service';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../domain/repositories/session.repository';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = req.cookies?.['access_token'] as string | undefined;
    if (!token) return next();

    try {
      const payload = this.tokenService.verifyAccessToken(token);

      const session = await this.sessionRepo.findById(payload.sessionId);
      if (!session?.isValid()) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        res.clearCookie('session_id');
        return next();
      }

      req.user = {
        userId: payload.sub,
        sessionId: payload.sessionId,
        email: payload.email,
        type: payload.type,
        adminRole: payload.adminRole,
      };
    } catch {
      // Token hết hạn → RefreshMiddleware sẽ xử lý tiếp
    }

    next();
  }
}
