# Module: core/integration

## Mục đích
Glue layer giữa domain events và notification queue. Lắng nghe events từ `EventEmitter2`, đẩy jobs vào BullMQ notification queue, xử lý jobs qua processor.

## Cấu trúc
```
core/integration/
├── handlers/                          # Event listeners (@OnEvent)
│   ├── on-user-created.handler.ts
│   ├── on-user-deactivated.handler.ts
│   ├── on-admin-created.handler.ts
│   ├── on-admin-deactivated.handler.ts
│   ├── on-file-uploaded.handler.ts
│   ├── on-config-changed.handler.ts
│   └── on-blog-post-published.handler.ts
├── notification-queue.service.ts      # Enqueue jobs vào QUEUE_NAMES.NOTIFICATION
├── notification.processor.ts          # @Processor — consume jobs, gọi SendNotificationUseCase
└── integration.module.ts
```

## Flow
```
Domain Event (EventEmitter2)
  → Handler (@OnEvent)
    → NotificationQueueService.enqueue(job)
      → BullMQ Queue (NOTIFICATION)
        → NotificationProcessor.process(job)
          → SendNotificationUseCase.execute(...)
```

## Thêm handler mới
```ts
// handlers/on-something.handler.ts
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class OnSomethingHandler {
  constructor(private readonly queueService: NotificationQueueService) {}

  @OnEvent('something.happened')
  async handle(event: SomethingHappenedEvent) {
    await this.queueService.enqueue({
      type: 'something-happened',
      payload: event.payload,
    });
  }
}
```
Sau đó đăng ký handler trong `IntegrationModule.providers`.

## Dependencies
- Import `NotificationModule` (để dùng `SendNotificationUseCase`)
- Import `BullModule.registerQueue({ name: QUEUE_NAMES.NOTIFICATION })`
- Không phải `@Global()` — chỉ import vào `app.module.ts`
