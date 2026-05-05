import { OnUserCreatedHandler } from './on-user-created.handler';
import { OnUserDeactivatedHandler } from './on-user-deactivated.handler';
import { OnAdminCreatedHandler } from './on-admin-created.handler';
import { OnAdminDeactivatedHandler } from './on-admin-deactivated.handler';
import { OnFileUploadedHandler } from './on-file-uploaded.handler';
import { OnConfigChangedHandler } from './on-config-changed.handler';
import { UserCreatedEvent } from '../../../modules/user/domain/events/user-created.event';
import { UserDeactivatedEvent } from '../../../modules/user/domain/events/user-deactivated.event';
import { AdminCreatedEvent } from '../../../modules/admin/domain/events/admin-created.event';
import { AdminDeactivatedEvent } from '../../../modules/admin/domain/events/admin-deactivated.event';
import { FileUploadedEvent } from '../../../modules/media/domain/events/file-uploaded.event';
import { ConfigChangedEvent } from '../../../modules/config/domain/events/config-changed.event';
import type { SendNotificationUseCase } from '../../../modules/notification/application/use-cases/send-notification.use-case';

const makeSendNotification = (): jest.Mocked<
  Pick<SendNotificationUseCase, 'execute'>
> => ({
  execute: jest
    .fn()
    .mockResolvedValue({ notificationId: 'n1', recipientCount: 0 }),
});

// All handlers verify: handle() resolves without error for valid events

describe('Integration handlers — @OnEvent wiring', () => {
  describe('OnUserCreatedHandler', () => {
    it('handles user.created event without throwing', async () => {
      const handler = new OnUserCreatedHandler(
        makeSendNotification() as unknown as SendNotificationUseCase,
      );
      const event = new UserCreatedEvent('u1', 'user@test.com', 'member');
      await expect(handler.handle(event)).resolves.toBeUndefined();
    });

    it('is decorated with @OnEvent("user.created")', () => {
      const meta = Reflect.getMetadata(
        'EVENT_LISTENER_METADATA',
        OnUserCreatedHandler.prototype.handle,
      );
      expect(meta).toBeDefined();
      expect(meta[0].event).toBe('user.created');
    });
  });

  describe('OnUserDeactivatedHandler', () => {
    it('handles user.deactivated event without throwing', async () => {
      const handler = new OnUserDeactivatedHandler(
        makeSendNotification() as unknown as SendNotificationUseCase,
      );
      const event = new UserDeactivatedEvent('u1');
      await expect(handler.handle(event)).resolves.toBeUndefined();
    });

    it('is decorated with @OnEvent("user.deactivated")', () => {
      const meta = Reflect.getMetadata(
        'EVENT_LISTENER_METADATA',
        OnUserDeactivatedHandler.prototype.handle,
      );
      expect(meta).toBeDefined();
      expect(meta[0].event).toBe('user.deactivated');
    });
  });

  describe('OnAdminCreatedHandler', () => {
    it('handles admin.created event without throwing', async () => {
      const handler = new OnAdminCreatedHandler(
        makeSendNotification() as unknown as SendNotificationUseCase,
      );
      const event = new AdminCreatedEvent('a1', 'admin@test.com', 'admin');
      await expect(handler.handle(event)).resolves.toBeUndefined();
    });

    it('is decorated with @OnEvent("admin.created")', () => {
      const meta = Reflect.getMetadata(
        'EVENT_LISTENER_METADATA',
        OnAdminCreatedHandler.prototype.handle,
      );
      expect(meta).toBeDefined();
      expect(meta[0].event).toBe('admin.created');
    });
  });

  describe('OnAdminDeactivatedHandler', () => {
    it('handles admin.deactivated event without throwing', async () => {
      const handler = new OnAdminDeactivatedHandler(
        makeSendNotification() as unknown as SendNotificationUseCase,
      );
      const event = new AdminDeactivatedEvent('a1');
      await expect(handler.handle(event)).resolves.toBeUndefined();
    });

    it('is decorated with @OnEvent("admin.deactivated")', () => {
      const meta = Reflect.getMetadata(
        'EVENT_LISTENER_METADATA',
        OnAdminDeactivatedHandler.prototype.handle,
      );
      expect(meta).toBeDefined();
      expect(meta[0].event).toBe('admin.deactivated');
    });
  });

  describe('OnFileUploadedHandler', () => {
    it('handles media.file_uploaded event without throwing', async () => {
      const handler = new OnFileUploadedHandler(
        makeSendNotification() as unknown as SendNotificationUseCase,
      );
      const event = new FileUploadedEvent('f1', 'photo.jpg', 'admin-1');
      await expect(handler.handle(event)).resolves.toBeUndefined();
    });

    it('is decorated with @OnEvent("media.file_uploaded")', () => {
      const meta = Reflect.getMetadata(
        'EVENT_LISTENER_METADATA',
        OnFileUploadedHandler.prototype.handle,
      );
      expect(meta).toBeDefined();
      expect(meta[0].event).toBe('media.file_uploaded');
    });
  });

  describe('OnConfigChangedHandler', () => {
    it('handles config.changed event without throwing', async () => {
      const handler = new OnConfigChangedHandler(
        makeSendNotification() as unknown as SendNotificationUseCase,
      );
      const event = new ConfigChangedEvent(
        'cfg1',
        'site.title',
        'Old',
        'New',
        'admin-1',
      );
      await expect(handler.handle(event)).resolves.toBeUndefined();
    });

    it('is decorated with @OnEvent("config.changed")', () => {
      const meta = Reflect.getMetadata(
        'EVENT_LISTENER_METADATA',
        OnConfigChangedHandler.prototype.handle,
      );
      expect(meta).toBeDefined();
      expect(meta[0].event).toBe('config.changed');
    });
  });
});
