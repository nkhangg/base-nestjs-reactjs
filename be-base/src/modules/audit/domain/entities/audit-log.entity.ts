import { randomUUID } from 'crypto';

export interface AuditLogProps {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  resource: string;
  permission: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ipAddress: string;
  userAgent: string;
  occurredAt: Date;
}

export class AuditLog {
  readonly id: string;
  readonly actorId: string;
  readonly actorEmail: string;
  readonly actorRole: string;
  readonly resource: string;
  readonly permission: string;
  readonly method: string;
  readonly path: string;
  readonly statusCode: number;
  readonly durationMs: number;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly occurredAt: Date;

  private constructor(props: AuditLogProps) {
    Object.assign(this, props);
  }

  static create(input: Omit<AuditLogProps, 'id' | 'occurredAt'>): AuditLog {
    return new AuditLog({ ...input, id: randomUUID(), occurredAt: new Date() });
  }

  static reconstitute(props: AuditLogProps): AuditLog {
    return new AuditLog(props);
  }
}
