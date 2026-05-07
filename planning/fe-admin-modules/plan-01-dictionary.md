# [FE] FEATURE PLAN — MODULE 1: dictionary (Quản lý từ điển)
> **Ngày:** 07/05/2026

---

## Tóm tắt
Admin quản lý kho từ vựng tiếng Nhật: tạo/sửa/xóa từ, lọc theo JLPT level và
status, duyệt các entries do user submit (pending → approved/rejected).
Tab "Pending" hiển thị danh sách chờ duyệt với nút Approve/Reject nhanh.

---

## Layer breakdown

### Types
Định nghĩa DictionaryEntry, CreateDictionaryEntryDto, UpdateDictionaryEntryDto, DictionaryStatus enum.

Files:
- CREATE `fe-base-admin/src/modules/dictionary/types/index.ts`
  — `DictionaryEntry { id, kanji?, hiragana, romaji, meanings: string[], jlptLevel?, status: 'pending'|'approved'|'rejected', isPublic, creatorId?, staffAuthorId?, verifiedBy?, createdAt }`
  — `CreateDictionaryEntryDto`, `UpdateDictionaryEntryDto`
  — `DictionarySearchParams` extends `NestjsPaginateParams` (filters: status, jlptLevel)

### Service
Files:
- CREATE `fe-base-admin/src/modules/dictionary/services/dictionary.service.ts`
  — `list(params)` → GET `/admin/dictionary`
  — `getPending()` → GET `/admin/dictionary/pending`
  — `getById(id)` → GET `/admin/dictionary/:id`
  — `create(dto)` → POST `/admin/dictionary`
  — `update(id, dto)` → PATCH `/admin/dictionary/:id`
  — `delete(id)` → DELETE `/admin/dictionary/:id`
  — `approve(id)` → POST `/admin/dictionary/:id/approve`
  — `reject(id, reason?)` → POST `/admin/dictionary/:id/reject`

### Hooks
Files:
- CREATE `fe-base-admin/src/modules/dictionary/hooks/useDictionary.ts`
  — `useDictionaryList(params)` → useQuery `QUERY_KEYS.DICTIONARY.LIST`
  — `usePendingDictionary()` → useQuery `QUERY_KEYS.DICTIONARY.PENDING`
  — `useDictionaryEntry(id)` → useQuery `QUERY_KEYS.DICTIONARY.ENTRY`
  — `useCreateDictionary()` → useMutation, invalidate LIST + PENDING on success
  — `useUpdateDictionary()` → useMutation, invalidate LIST + ENTRY
  — `useDeleteDictionary()` → useMutation, invalidate LIST
  — `useApproveDictionary()` → useMutation, invalidate LIST + PENDING + ENTRY
  — `useRejectDictionary()` → useMutation, invalidate LIST + PENDING + ENTRY

### Components
Files:
- CREATE `fe-base-admin/src/modules/dictionary/components/DictionaryPage.tsx`
  — Tabs: "Tất cả" (DataTable server-side) + "Chờ duyệt" (pending list)
  — Filter: status (select), jlptLevel (select N1–N5), search text (kanji/hiragana/romaji)
  — Actions: Tạo mới, Edit, Delete (confirm), Approve/Reject (trực tiếp ở tab Pending)
- CREATE `fe-base-admin/src/modules/dictionary/components/DictionaryEntryModal.tsx`
  — Form tạo/sửa: kanji (optional), hiragana*, romaji*, meanings (tag input), jlptLevel (select), isPublic (checkbox)
  — Validation Zod: hiragana required, meanings min 1 item
- CREATE `fe-base-admin/src/modules/dictionary/components/MeaningsInput.tsx`
  — Tag input component cho mảng meanings (tái dụng pattern TagInput từ blog module)
- CREATE `fe-base-admin/src/modules/dictionary/components/RejectReasonDialog.tsx`
  — Dialog nhập lý do reject khi từ chối entry

### Router & Navigation
Files:
- MODIFY `fe-base-admin/src/app/router.tsx`
  — Thêm lazy import `DictionaryPage` + route `/dictionary` trong AdminGuard block
- MODIFY `fe-base-admin/src/config/routes.ts`
  — Thêm `DICTIONARY: '/dictionary'`

### i18n
```
vi.json:
  dictionary.title: "Từ điển"
  dictionary.pending: "Chờ duyệt"
  dictionary.approved: "Đã duyệt"
  dictionary.rejected: "Từ chối"
  dictionary.approve: "Duyệt"
  dictionary.reject: "Từ chối"
  dictionary.rejectReason: "Lý do từ chối"
  dictionary.jlptLevel: "Cấp JLPT"
  dictionary.kanji: "Kanji"
  dictionary.hiragana: "Hiragana"
  dictionary.romaji: "Romaji"
  dictionary.meanings: "Nghĩa"

en.json:
  dictionary.title: "Dictionary"
  dictionary.pending: "Pending"
  dictionary.approved: "Approved"
  dictionary.rejected: "Rejected"
  dictionary.approve: "Approve"
  dictionary.reject: "Reject"
  dictionary.rejectReason: "Rejection reason"
  dictionary.jlptLevel: "JLPT Level"
  dictionary.kanji: "Kanji"
  dictionary.hiragana: "Hiragana"
  dictionary.romaji: "Romaji"
  dictionary.meanings: "Meanings"
```

---

## UX notes
- Loading: Skeleton rows trong DataTable
- Error: `toast.error()` + retry button trong DataTable
- Empty: `Empty` component với nút "Tạo từ đầu tiên"
- Tab "Chờ duyệt" hiển thị badge count (số lượng pending)
- Approve/Reject action trong tab Pending: inline buttons trên mỗi row; Reject mở `RejectReasonDialog` trước khi submit
- Confirmation dialog: Yes khi Delete (destructive)

---

## Edge cases & risks
- `meanings` là JSON array → dùng `MeaningsInput` tag-input, serialize trước khi gửi API
- JLPT level là `Int?` (nullable) → filter "Tất cả level" = undefined, không gửi param
- Pending tab không cần phân trang nếu ít — dùng client-side mode DataTable; nếu lớn cần server-side riêng với endpoint `/admin/dictionary/pending`
- Quyền `moderate` (approve/reject) tách khỏi quyền CRUD thông thường → ẩn nút Approve/Reject nếu user không có permission `moderate`

---

## Effort estimate
| Layer | Effort |
|---|---|
| Types | Low |
| Service | Low |
| Hooks | Medium |
| Components | Medium |
| Router | Low |
| **Total** | **Medium** |

---

## Checklist khi implement
- [ ] Tab Pending hiển thị badge count từ `usePendingDictionary().data?.length`
- [ ] New types defined in `types/index.ts`
- [ ] Service function added for each new API call
- [ ] `useQuery` hooks có correct `queryKey` từ `QUERY_KEYS.DICTIONARY.*`
- [ ] `useMutation` hooks invalidate relevant queries on success
- [ ] Toast notifications on success and error
- [ ] All user-facing strings dùng `useTranslation()` — keys added to vi.json + en.json
- [ ] Forms dùng React Hook Form + Zod validation
- [ ] Delete action có `ConfirmDialog`
- [ ] Reject action mở `RejectReasonDialog` trước khi gọi API
- [ ] New route dùng lazy loading và thêm vào `router.tsx`
- [ ] Thêm `QUERY_KEYS.DICTIONARY` vào `src/shared/constants/index.ts`
- [ ] `fe-base-admin/.claude/modules/dictionary.md` tạo sau khi implement
