# Module: modules/dictionary

## Mục đích
Quản lý kho từ vựng tiếng Nhật: CRUD + workflow duyệt bài (pending → approved/rejected). Hỗ trợ tìm kiếm theo kanji/hiragana/romaji, lọc theo JLPT level và status.

## Cấu trúc
```
modules/dictionary/
├── components/
│   ├── DictionaryPage.tsx          # Main page: Tabs "Tất cả" + "Chờ duyệt"
│   ├── DictionaryEntryModal.tsx    # Form tạo/sửa từ (RHF + Zod)
│   ├── MeaningsInput.tsx           # Tag input cho mảng meanings
│   └── RejectReasonDialog.tsx      # Dialog nhập lý do reject
├── hooks/
│   └── useDictionary.ts            # useQuery + useMutation wrappers
├── services/
│   └── dictionary.service.ts       # 8 API calls
├── types/
│   └── index.ts                    # DictionaryEntry, DTOs, DictionaryStatus
└── index.ts
```

## Routes
| Route | Component | Layout |
|---|---|---|
| `/dictionary` | `DictionaryPage` | `MainLayout` (AdminGuard) |

## API Endpoints
| Method | Path | Hook/Function |
|---|---|---|
| GET | `/admin/dictionary` | `useDictionaryList` (paginate) |
| GET | `/admin/dictionary/pending` | `usePendingDictionary` |
| GET | `/admin/dictionary/:id` | `useDictionaryEntry` |
| POST | `/admin/dictionary` | `useCreateDictionary` |
| PATCH | `/admin/dictionary/:id` | `useUpdateDictionary` |
| DELETE | `/admin/dictionary/:id` | `useDeleteDictionary` |
| POST | `/admin/dictionary/:id/approve` | `useApproveDictionary` |
| POST | `/admin/dictionary/:id/reject` | `useRejectDictionary` |

## Query Keys
`['dictionary', 'list']`, `['dictionary', 'pending']`, `['dictionary', 'entry', id]`

## Types
```ts
DictionaryStatus = 'pending' | 'approved' | 'rejected'

DictionaryEntry {
  id, kanji?, hiragana, romaji, meanings: string[],
  jlptLevel?, status, isPublic, creatorId?, staffAuthorId?,
  verifiedBy?, createdAt, updatedAt
}
```

## Gotchas
- `meanings` là `string[]` (JSON array từ BE) — dùng `MeaningsInput` tag input, không slug-ify giá trị
- Tab "Chờ duyệt" dùng endpoint riêng `/admin/dictionary/pending` (không phải filter từ list)
- Inline approve/reject trong tab Pending — Reject mở `RejectReasonDialog` trước
- JLPT level `null` = không rõ cấp → filter không gửi param khi "Tất cả"
- `MeaningsInput` khác `TagInput` của blog: không lowercase/slug-ify (meanings là từ thật)
- `DictionaryEntryModal` có 2 mode nhập liệu: **Form** (default) và **JSON** (toggle ở header)
  - Mode toggle hiện ở cả create và edit mode
  - Form→JSON: serialize form values hiện tại vào textarea
  - JSON→Form: parse + populate form nếu JSON hợp lệ
  - JSON submit validate bằng `jsonSchema` (Zod) trước khi gọi API
  - JSON mode chỉ expose editable fields — `id`, `status`, `createdAt`, v.v. không bị lộ
