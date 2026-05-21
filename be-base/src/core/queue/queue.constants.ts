export const QUEUE_NAMES = {
  MAIL: 'mail',
  NOTIFICATION: 'notification',
} as const;

// ---- Mail queue ----

export const MAIL_JOBS = {
  SEND_PASSWORD_RESET: 'send-password-reset',
} as const;

export interface SendPasswordResetJobData {
  to: string;
  resetLink: string;
}

// ---- Notification queue ----

export const NOTIFICATION_JOBS = {
  SEND: 'send',
} as const;

export interface SendNotificationJobData {
  title: string;
  body: string;
  type: 'system' | 'info' | 'warning' | 'alert' | 'success';
  data?: Record<string, unknown>;
  targets: NotificationTargetData[];
  senderId?: string;
  senderType?: 'admin' | 'system';
}

// Serialisable union — dùng string cho action thay vì Action branded type
// để an toàn qua JSON round-trip trong Redis
export type NotificationTargetData =
  | { kind: 'individual'; recipientId: string; recipientType: 'user' | 'admin' }
  | { kind: 'by-role'; roleName: string; subjectType: 'user' | 'admin' }
  | {
      kind: 'by-permission';
      resource: string;
      action: string;
      subjectType: 'user' | 'admin';
    }
  | { kind: 'all-users' }
  | { kind: 'all-admins' }
  | { kind: 'broadcast' };
