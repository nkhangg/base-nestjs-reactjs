import {
  ActivityLog,
  type ActionType,
} from '../../domain/entities/activity-log.entity';

interface ActivityLogRecord {
  id: string;
  userId: string;
  actionType: string;
  xpGained: number;
  referenceId: string | null;
  createdAt: Date;
}

export class ActivityLogMapper {
  static toDomain(r: ActivityLogRecord): ActivityLog {
    return ActivityLog.reconstitute(r.id, {
      userId: r.userId,
      actionType: r.actionType as ActionType,
      xpGained: r.xpGained,
      referenceId: r.referenceId,
      createdAt: r.createdAt,
    });
  }
}
