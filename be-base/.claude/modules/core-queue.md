# Module: core/queue

## Mục đích
BullMQ global setup — configure Redis connection và default job options. `@Global()` nên các module chỉ cần `BullModule.registerQueue(...)` mà không cần khai báo lại connection.

## Cấu trúc
```
core/queue/
├── queue.constants.ts    # QUEUE_NAMES enum
└── queue.module.ts       # @Global(), BullModule.forRoot(...)
```

## Queue Names
```ts
// queue.constants.ts
export const QUEUE_NAMES = {
  NOTIFICATION: 'notification',
  // thêm queue mới vào đây
} as const;
```

## Default Job Options
```ts
BullModule.forRoot({
  connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
})
```

## Thêm queue mới
1. Thêm tên vào `QUEUE_NAMES` trong `queue.constants.ts`
2. Trong module cần dùng: `BullModule.registerQueue({ name: QUEUE_NAMES.MY_QUEUE })`
3. Tạo processor với `@Processor(QUEUE_NAMES.MY_QUEUE)`

## Env
`REDIS_URL` — default `redis://localhost:6379`
