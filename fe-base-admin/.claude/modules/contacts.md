# Module: modules/contacts

## Mục đích
Admin UI để xem và quản lý form liên hệ từ người dùng. Hỗ trợ filter theo trạng thái, tìm kiếm, xem chi tiết, cập nhật trạng thái + ghi chú, xóa. Tự động đánh dấu READ khi admin mở PENDING contact.

## Cấu trúc
```
src/modules/contacts/
├── types/
│   └── index.ts                    — Contact, ContactStatus, UpdateContactStatusDto, ContactListResponse
├── services/
│   └── contacts.service.ts         — listContacts, getContact, updateContactStatus, deleteContact
├── hooks/
│   └── useContacts.ts              — useContactList, useContact, useUpdateContactStatus, useDeleteContact
├── components/
│   ├── ContactsPage.tsx            — DataTable + stat cards + filter
│   └── ContactDetailDialog.tsx     — Dialog: full info + RHF form + ConfirmDialog delete
└── index.ts                        — barrel export
```

## Routes
| Path | Component | Guard |
|---|---|---|
| `/contacts` | ContactsPage | AdminGuard |

## API Endpoints
| Function | Method | Path |
|---|---|---|
| listContacts | GET | /admin/contacts |
| getContact | GET | /admin/contacts/:id |
| updateContactStatus | PATCH | /admin/contacts/:id |
| replyToContact | POST | /admin/contacts/:id/reply |
| deleteContact | DELETE | /admin/contacts/:id |

## Query Keys
```ts
QUERY_KEYS.CONTACTS.LIST   = ['contacts', 'list']
QUERY_KEYS.CONTACTS.DETAIL = ['contacts', 'detail']
```

## Hooks
| Hook | Type | Invalidates |
|---|---|---|
| useContactList | useQuery | — |
| useContact | useQuery | — |
| useUpdateContactStatus | useMutation | LIST + DETAIL |
| useReplyToContact | useMutation | LIST + DETAIL |
| useDeleteContact | useMutation | LIST |

## ContactDetailDialog — Layout

Dialog `max-w-2xl` với 3 tabs (Radix UI Tabs từ shadcn):

| Tab | Value | Nội dung |
|---|---|---|
| Thông tin | `info` | Subject, message, timestamps (2-column cards) |
| Quản lý | `manage` | Status select (dot indicator) + note textarea + delete/save |
| Phản hồi | `reply` | Reply form hoặc "already replied" badge |

Header luôn hiện: avatar initials + name + email/phone + status badge (dùng i18n key).

## Gotchas
- `useContactList` uses `keepPreviousData` — table doesn't flash empty on pagination changes
- Auto-mark READ uses a ref (`autoReadFiredRef`) to guard against React 18 StrictMode double-effect fire
- Status update form is disabled (`disabled={!isDirty}`) until user makes a change — prevents redundant API calls
- `fullName` is a computed field from BE — the DataTable key is `fullName`, not `firstName+lastName`
- Delete → `onSuccess` calls both `setShowDeleteConfirm(false)` and `onClose()` to close both dialogs cleanly
- Reply section uses a **separate** `useForm` instance (replySchema) — isolated from status form `isDirty`
- When `contact.respondedAt != null`, reply tab shows green badge + tab nav shows green dot indicator
- `STATUS_OPTION_KEYS` replaces old hardcoded `STATUS_OPTIONS` array — labels come from `t('contacts.statusOptions.<key>')`
- `getInitials(name)` extracts first 2 uppercase initials from fullName for avatar display
