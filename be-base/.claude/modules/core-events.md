# Module: core/events

## Mục đích
Domain event bus — cho phép các module giao tiếp loose-coupled qua events mà không import lẫn nhau. `@Global()` nên `DOMAIN_EVENT_BUS` available toàn app.

## Cấu trúc
```
core/events/
├── domain/
│   └── domain-event-bus.interface.ts   # IDomainEventBus { publish(event) }
├── event-publisher.service.ts          # Implements IDomainEventBus, wrap EventEmitter2
├── events.module.ts                    # @Global(), export DOMAIN_EVENT_BUS
└── index.ts
```

## Sử dụng

### Publish event (từ use-case)
```ts
import { DOMAIN_EVENT_BUS, type IDomainEventBus } from '../../core/events';

constructor(@Inject(DOMAIN_EVENT_BUS) private readonly events: IDomainEventBus) {}

// Sau khi domain action thành công:
await this.events.publish(new UserCreatedEvent({ userId, email }));
```

### Define event
```ts
// Đặt trong module domain, ví dụ: modules/user/domain/events/user-created.event.ts
export class UserCreatedEvent {
  readonly name = 'user.created';
  constructor(public readonly payload: { userId: string; email: string }) {}
}
```

### Handle event (trong IntegrationModule)
```ts
import { OnEvent } from '@nestjs/event-emitter';

@OnEvent('user.created')
async handle(event: UserCreatedEvent) {
  // xử lý side-effects
}
```

## Gotchas
- EventEmitter2 config: `wildcard: true, delimiter: '.'` → dùng được pattern như `'user.*'`
- Handlers nằm trong `core/integration/` (không phải trong chính domain module) để tránh circular deps
- `EventPublisher` implements cả `IDomainEventBus` lẫn `EventEmitter2` — module bind `DOMAIN_EVENT_BUS` → `useExisting: EventPublisher`
