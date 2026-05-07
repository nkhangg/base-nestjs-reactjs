import { BaseEntity } from '../../../../shared/domain/base-entity';
import { ActivityLogId } from '../value-objects/activity-log-id.vo';

export type ActionType =
  | 'read_article'
  | 'quiz_done'
  | 'flashcard_review'
  | 'login';

export interface ActivityLogProps {
  userId: string;
  actionType: ActionType;
  xpGained: number;
  referenceId: string | null;
  createdAt: Date;
}

export class ActivityLog extends BaseEntity<ActivityLogId> {
  private props: ActivityLogProps;

  private constructor(id: ActivityLogId, props: ActivityLogProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    userId: string;
    actionType: ActionType;
    xpGained?: number;
    referenceId?: string;
  }): ActivityLog {
    return new ActivityLog(ActivityLogId.create(), {
      userId: params.userId,
      actionType: params.actionType,
      xpGained: params.xpGained ?? 0,
      referenceId: params.referenceId ?? null,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: ActivityLogProps): ActivityLog {
    return new ActivityLog(ActivityLogId.from(id), props);
  }

  get userId(): string {
    return this.props.userId;
  }
  get actionType(): ActionType {
    return this.props.actionType;
  }
  get xpGained(): number {
    return this.props.xpGained;
  }
  get referenceId(): string | null {
    return this.props.referenceId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
