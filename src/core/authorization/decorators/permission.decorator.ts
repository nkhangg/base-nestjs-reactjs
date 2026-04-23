import { SetMetadata } from '@nestjs/common';
import type { Action } from '../domain/value-objects/action.vo';
import type { SubjectType } from '../domain/value-objects/subject.vo';

export const PERMISSION_KEY = 'authorization:permission';

export interface PermissionMetadata {
  resource: string;
  action: Action;
  subjectType?: SubjectType;
}

export const Permission = (
  resource: string,
  action: Action,
  options?: { subjectType?: SubjectType },
) =>
  SetMetadata(PERMISSION_KEY, {
    resource,
    action,
    subjectType: options?.subjectType,
  });
