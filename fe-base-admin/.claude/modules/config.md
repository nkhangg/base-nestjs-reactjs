# Module: modules/config

## Mục đích
Quản lý key-value config (JSON). Có editor đặc biệt cho object JSON dạng cards. Toggle bật/tắt config.

## Cấu trúc
```
modules/config/
├── components/
│   ├── ConfigPage.tsx          # List configs + CRUD
│   ├── ConfigFormModal.tsx     # Tạo/sửa config (key, value JSON, description)
│   └── ObjectEditorCards.tsx  # Hiển thị/edit JSON object dạng card key-value
├── hooks/
│   ├── useConfigs.ts           # useConfigList, useCreateConfig, useUpdateConfig,
│   │                           # useToggleConfig, useDeleteConfig
│   └── useJsonObjectEditor.ts  # State management cho ObjectEditorCards
├── services/
│   └── config.service.ts
├── types/
│   └── index.ts                # AppConfig { id, key, value, isActive, description }
└── index.ts
```

## Routes
| Route | Component | Guard |
|---|---|---|
| `/configs` | `ConfigPage` | `AdminGuard` |

## API Endpoints
| Method | Path | Hook |
|---|---|---|
| GET | `/admin/configs` | `useConfigList` (paginate) |
| POST | `/admin/configs` | `useCreateConfig` |
| GET | `/admin/configs/:id` | `useConfigDetail` |
| PATCH | `/admin/configs/:id` | `useUpdateConfig` |
| PATCH | `/admin/configs/:id/toggle` | `useToggleConfig` |
| DELETE | `/admin/configs/:id` | `useDeleteConfig` |

## Query Keys
`QUERY_KEYS.CONFIGS`

## ObjectEditorCards
Component cho phép edit JSON object dạng `{ key: value }` qua UI cards — add/remove/edit từng cặp key-value. Dùng bên trong `ConfigFormModal` khi `value` là object.

## PageConfigEditor
Sheet slide-over chuyên biệt cho configs có key prefix `pages.*`. Mở bằng button "Page Editor" trên `ConfigPage`.

Cấu trúc:
```
modules/config/
├── components/
│   ├── AutoFieldEditor.tsx     # Auto-render field theo type (string/number/boolean/url/json)
│   └── PageConfigEditor.tsx    # Sheet: sidebar section + auto-form panel
├── hooks/
│   └── usePageConfigs.ts       # Fetch pages.* configs, group theo section
```

UX flow:
- Sidebar trái: group configs theo segment thứ 2 (`pages.global.*` → section "global")
- Click config → panel phải render auto-form từng field của JSON value
- Toggle "Raw JSON" → chỉnh sửa JSON thô trực tiếp
- Fields có key chứa `url/image/logo/src/photo/avatar` → có nút MediaPicker
- Lưu dùng lại `useUpdateConfig` + `valueKeyOrder: Object.keys(editedValue)`
- Dirty check: nếu có thay đổi chưa lưu mà chuyển config → `ConfirmDialog`
