import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { ADMIN_PERMISSION_KEY } from './require-permission.decorator';
import { AuthorizationService, Subject } from '../authorization';
import type { Action } from '../authorization';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user?.adminRole)
      throw new UnauthorizedException('Admin access required');

    const required = this.reflector.getAllAndOverride<{
      resource: string;
      permission: Action;
    }>(ADMIN_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!required) return true;

    const subject = Subject.of(user.userId, 'admin');
    const allowed = await this.authorizationService.can(
      subject,
      required.resource,
      required.permission,
    );

    if (!allowed)
      throw new UnauthorizedException(
        `Permission denied: "${required.permission}" on "${required.resource}"`,
      );

    return true;
  }
}
