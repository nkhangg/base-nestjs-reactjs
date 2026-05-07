# Module: modules/organization

## Mục đích
Admin xem và quản lý danh sách Organizations và Classrooms (B2B). Xem danh sách thành viên, invite code, và báo cáo tiến độ.

## Cấu trúc
```
modules/organization/
├── components/
│   ├── OrganizationPage.tsx           # List table + search + delete org
│   ├── OrganizationDetailDrawer.tsx   # Sheet: thông tin org + danh sách classrooms
│   └── ClassroomDetailDrawer.tsx      # Sheet: Tabs (Thành viên + Báo cáo tiến độ)
├── hooks/
│   └── useOrganization.ts             # useOrgList, useOrg, useDeleteOrg, useClassroomList,
│                                      # useMemberList, useRemoveMember, useClassroomReport
├── services/
│   └── organization.service.ts        # 8 API calls
├── types/
│   └── index.ts                       # Organization, Classroom, MemberReport, list response types
└── index.ts                           # exports OrganizationPage
```

## Routes
| Route | Component | Layout |
|---|---|---|
| `/organizations` | `OrganizationPage` | `AdminGuard + MainLayout` |

## API Endpoints
| Method | Path | Hook |
|---|---|---|
| GET | `/admin/organizations` | `useOrgList` |
| GET | `/admin/organizations/:id` | `useOrg` |
| DELETE | `/admin/organizations/:id` | `useDeleteOrg` |
| GET | `/admin/organizations/:orgId/classrooms` | `useClassroomList` |
| GET | `/admin/classrooms/:id/members` | `useMemberList` |
| DELETE | `/admin/classrooms/:classroomId/members/:userId` | `useRemoveMember` |
| GET | `/admin/classrooms/:id/report` | `useClassroomReport` |

## Query Keys (`QUERY_KEYS.ORGANIZATION`)
```ts
LIST:       ['organization', 'list']
DETAIL:     ['organization', 'detail']
CLASSROOMS: ['organization', 'classrooms']
MEMBERS:    ['organization', 'members']
REPORT:     ['organization', 'report']
```

## UX Patterns
- **OrganizationPage**: simple table với search + pagination thủ công (không dùng DataTable pattern vì API không phải nestjs-paginate)
- **OrganizationDetailDrawer**: Sheet slide-over → click classroom → mở ClassroomDetailDrawer
- **ClassroomDetailDrawer**: Sheet với Tabs (Members | Report) + copy invite code (clipboard)
- Report tab dùng `staleTime: 5 * 60 * 1000` (5 phút)
- Remove member có `ConfirmDialog` (variant: "danger")
- Delete org có `ConfirmDialog` (variant: "danger") — cascade xóa classrooms + members

## i18n namespace: `organization`
Keys: title, subtitle, name, ownerId, createdAt, total, classroom, inviteCode, members, memberName, joinedAt, report, removeMember, removeMemberConfirm, copyInviteCode, inviteCodeCopied, empty, emptyDesc, deleteOrg, deleteOrgConfirm

## Nav item
Resource key: `'organization-management'` (in MainLayout + ADMIN_NAV_RESOURCES)
