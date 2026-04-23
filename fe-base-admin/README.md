# My App

React + Vite base project theo Clean Architecture.

## Tech stack

| Layer | Thư viện |
|---|---|
| UI | React 19, Tailwind CSS |
| Routing | React Router DOM v7 (Library Mode) |
| Data fetching | TanStack Query v5 |
| HTTP client | Axios |
| i18n | i18next + react-i18next |
| Testing | Vitest + Testing Library |
| Linting | ESLint 9 (flat config) + Prettier |

## Bắt đầu

```bash
# 1. Cài dependencies
npm install

# 2. Copy env
cp .env.example .env

# 3. Chạy dev
npm run dev
```

## Scripts

```bash
npm run dev          # Dev server tại localhost:3000
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Kiểm tra lỗi lint
npm run lint:fix     # Tự sửa lỗi lint
npm run format       # Format code với Prettier
npm run test         # Chạy tests (watch mode)
npm run test:coverage # Coverage report
npm run type-check   # Kiểm tra TypeScript
```

## Cấu trúc

```
src/
├── app/             # Router + App root — không chứa business logic
├── modules/         # Feature modules (tự thêm theo template bên dưới)
├── shared/          # Components, hooks, utils dùng chung
│   ├── components/ui/
│   ├── hooks/
│   ├── layouts/
│   ├── utils/
│   ├── types/
│   ├── constants/
│   ├── i18n/
│   └── assets/
├── lib/             # Infrastructure: axios, query client, storage
├── store/           # Global state (theme, locale)
└── config/          # env, routes, app.config
```

## Thêm module mới

```bash
mkdir -p src/modules/my-feature/{components,hooks,services,store,types,utils}
touch src/modules/my-feature/index.ts
```

Template `index.ts`:

```ts
// Public API — chỉ export những gì module khác được phép dùng
export { MyFeaturePage } from './components/MyFeaturePage'
export { useMyFeature } from './hooks/useMyFeature'
```

## Quy tắc import

- Module khác chỉ được import qua `@modules/<feature>/index` — **không được** import sâu vào internal
- `shared/` không được import từ bất kỳ module nào
- Luôn dùng path alias (`@/`, `@shared/`, `@lib/`), không dùng relative path (`../../`)
