# [FE] FEATURE PLAN — MODULE 5: organization (Quản lý tổ chức / lớp học — B2B Phase 2)
> **Ngày:** 07/05/2026

---

## Tóm tắt
Admin xem và quản lý danh sách Organizations và Classrooms. Xem danh sách thành
viên của từng lớp, xem invite code, và xem classroom report (aggregate progress
data của members). Scope Phase 2 — UI đơn giản, chủ yếu read + delete member.

---

## Layer breakdown

### Types
Files:
- CREATE `fe-base-admin/src/modules/organization/types/index.ts`
  — `Organization { id, name, ownerId, createdAt, classroomCount? }`
  — `Classroom { id, orgId, teacherId, name, inviteCode, createdAt, memberCount? }`
  — `ClassroomMember { classroomId, userId, joinedAt, user?: { username, email } }`
  — `ClassroomReport { classroomId, members: { userId, username, xpTotal, streakCount }[] }`

### Service
Files:
- CREATE `fe-base-admin/src/modules/organization/services/organization.service.ts`
  — `listOrgs(params)` → GET `/admin/organizations` (paginate)
  — `getOrg(id)` → GET `/admin/organizations/:id`
  — `deleteOrg(id)` → DELETE `/admin/organizations/:id`
  — `listClassrooms(orgId)` → GET `/admin/organizations/:orgId/classrooms`
  — `getClassroom(id)` → GET `/admin/classrooms/:id`
  — `listMembers(classroomId)` → GET `/admin/classrooms/:classroomId/members`
  — `removeMember(classroomId, userId)` → DELETE `/admin/classrooms/:classroomId/members/:userId`
  — `getClassroomReport(classroomId)` → GET `/admin/classrooms/:classroomId/report`

### Hooks
Files:
- CREATE `fe-base-admin/src/modules/organization/hooks/useOrganization.ts`
  — `useOrgList(params)`, `useOrg(id)`, `useDeleteOrg`
  — `useClassroomList(orgId)`, `useClassroom(id)`
  — `useMemberList(classroomId)`, `useRemoveMember`
  — `useClassroomReport(classroomId)`

### Components
Files:
- CREATE `fe-base-admin/src/modules/organization/components/OrganizationPage.tsx`
  — DataTable organizations: name, ownerId, classroomCount, createdAt
  — Click vào row → mở `OrganizationDetailDrawer`
  — Action: Delete org (ConfirmDialog)
- CREATE `fe-base-admin/src/modules/organization/components/OrganizationDetailDrawer.tsx`
  — `Sheet` component: thông tin org + danh sách classrooms
  — Click vào classroom item → mở `ClassroomDetailDrawer`
- CREATE `fe-base-admin/src/modules/organization/components/ClassroomDetailDrawer.tsx`
  — Tabs: "Thành viên" (DataTable, action: Remove member) + "Báo cáo tiến độ"
  — Invite code: hiển thị với copy button (`navigator.clipboard.writeText()` + toast)
  — Report tab: bảng members với XP + streak

### Router & Navigation
Files:
- MODIFY `fe-base-admin/src/app/router.tsx`
  — Thêm `OrganizationPage` route `/organizations` trong AdminGuard + MainLayout
- MODIFY `fe-base-admin/src/config/routes.ts`
  — `ORGANIZATIONS: '/organizations'`

### i18n
```
vi.json:
  organization.title: "Tổ chức / Lớp học"
  organization.name: "Tên tổ chức"
  organization.classroom: "Lớp học"
  organization.inviteCode: "Mã mời"
  organization.members: "Thành viên"
  organization.report: "Báo cáo tiến độ"
  organization.removeMember: "Xóa thành viên"
  organization.copyInviteCode: "Sao chép mã mời"
  organization.inviteCodeCopied: "Đã sao chép mã mời"

en.json:
  organization.title: "Organizations"
  organization.name: "Organization name"
  organization.classroom: "Classroom"
  organization.inviteCode: "Invite code"
  organization.members: "Members"
  organization.report: "Progress report"
  organization.removeMember: "Remove member"
  organization.copyInviteCode: "Copy invite code"
  organization.inviteCodeCopied: "Invite code copied"
```

---

## UX notes
- Loading: Skeleton trong DataTable và Drawer content
- Error: `toast.error()` nếu load org/classroom thất bại
- Empty: "Chưa có tổ chức nào" với text info (user tự tạo từ teacher portal)
- Drawer pattern (`Sheet` component) giữ context page ở background — không navigate away
- Copy invite code: `navigator.clipboard.writeText()` + `toast.success("Đã sao chép")`
- Remove member: `ConfirmDialog` vì destructive

---

## Edge cases & risks
- BE plan hiện tại chỉ có `/teacher/*` và `/me/*` endpoints — **cần confirm BE sẽ expose `/admin/organizations` trước khi implement FE**
- Remove member khi teacher là member duy nhất → ẩn nút hoặc hiển thị warning
- Classroom report aggregate data có thể slow nếu nhiều members → `staleTime: 5 * 60 * 1000`
- Invite code regenerate chưa có trong BE Phase 2 plan → không implement button này

---

## Effort estimate
| Layer | Effort |
|---|---|
| Types | Low |
| Service | Low |
| Hooks | Low |
| Components | Medium |
| Router | Low |
| **Total** | **Medium** |

---

## Checklist khi implement
- [ ] **Confirm BE expose `/admin/organizations` endpoints trước khi bắt đầu**
- [ ] Drawer dùng `Sheet` component từ shared UI
- [ ] Copy invite code dùng `navigator.clipboard` + `toast.success()` feedback
- [ ] Remove member có `ConfirmDialog`
- [ ] Classroom report dùng `staleTime: 5 * 60 * 1000`
- [ ] New types defined in `types/index.ts`
- [ ] Service function added for each API call
- [ ] `useQuery` hooks có correct `queryKey` từ `QUERY_KEYS.ORGANIZATION.*`
- [ ] `useMutation` invalidate relevant queries on success
- [ ] All user-facing strings dùng `useTranslation()`
- [ ] Thêm `QUERY_KEYS.ORGANIZATION` vào `src/shared/constants/index.ts`
- [ ] `fe-base-admin/.claude/modules/organization.md` tạo sau khi implement
