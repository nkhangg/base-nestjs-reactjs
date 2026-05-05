export const NOTIFICATION_EMITTER = Symbol('NOTIFICATION_EMITTER');

export interface INotificationEmitter {
  emitToRecipient(
    recipientId: string,
    recipientType: string,
    payload: unknown,
  ): void;
}
