import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from '../application/services/authorization.service';
import { Subject } from '../domain/value-objects/subject.vo';
import type { SubjectType } from '../domain/value-objects/subject.vo';
import {
  PERMISSION_KEY,
  type PermissionMetadata,
} from '../decorators/permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    protected readonly authorizationService: AuthorizationService,
    protected readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) throw new UnauthorizedException('Authentication required');

    const required = this.reflector.getAllAndOverride<PermissionMetadata>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required) return true;

    if (required.subjectType && user.type !== required.subjectType) {
      throw new ForbiddenException(
        `Access restricted to ${required.subjectType} accounts`,
      );
    }

    const subject = Subject.of(user.userId, user.type as SubjectType);
    const allowed = await this.authorizationService.can(
      subject,
      required.resource,
      required.action,
    );

    if (!allowed) {
      throw new ForbiddenException(
        `Permission denied: "${required.action}" on "${required.resource}"`,
      );
    }

    return true;
  }
}

@Injectable()
export class UserPermissionGuard extends PermissionGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    if (req.user?.type !== 'user') {
      throw new UnauthorizedException('User access required');
    }
    return super.canActivate(context);
  }
}

@Injectable()
export class MerchantPermissionGuard extends PermissionGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    if (req.user?.type !== 'merchant') {
      throw new UnauthorizedException('Merchant access required');
    }
    return super.canActivate(context);
  }
}
