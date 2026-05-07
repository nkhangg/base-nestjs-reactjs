# Module: modules/organization

## Mục đích
B2B — Hỗ trợ giáo viên tạo tổ chức (Organization), quản lý lớp học (Classroom), quản lý thành viên và xem báo cáo tiến độ nhóm. Học viên tham gia lớp qua invite code 8 ký tự.

## Cấu trúc
```
modules/organization/
├── domain/
│   ├── entities/
│   │   ├── organization.entity.ts    # { id, name, ownerId, createdAt }
│   │   ├── classroom.entity.ts       # { id, orgId, teacherId, name, inviteCode, createdAt }
│   │   └── classroom-member.entity.ts # { classroomId, userId, joinedAt } (composite key, không dùng BaseEntity)
│   ├── value-objects/
│   │   ├── organization-id.vo.ts
│   │   └── classroom-id.vo.ts
│   └── repositories/
│       ├── organization.repository.ts  # ORGANIZATION_REPOSITORY
│       ├── classroom.repository.ts     # CLASSROOM_REPOSITORY
│       └── classroom-member.repository.ts  # CLASSROOM_MEMBER_REPOSITORY + MemberReport type
├── application/use-cases/
│   ├── create-organization.use-case.ts
│   ├── list-organizations.use-case.ts
│   ├── get-organization.use-case.ts
│   ├── update-organization.use-case.ts
│   ├── create-classroom.use-case.ts       # invite code = randomBytes(4).hex, retry on P2002
│   ├── list-classrooms.use-case.ts        # by teacherId
│   ├── list-my-classrooms.use-case.ts     # by userId (student)
│   ├── get-classroom.use-case.ts
│   ├── join-classroom-by-code.use-case.ts
│   ├── get-classroom-report.use-case.ts   # MemberReport: userId, userName, xpTotal, joinedAt
│   └── remove-member.use-case.ts
├── infrastructure/
│   ├── mappers/
│   │   ├── organization.mapper.ts
│   │   ├── classroom.mapper.ts
│   │   └── classroom-member.mapper.ts
│   └── repositories/
│       ├── prisma-organization.repository.ts
│       ├── in-memory-organization.repository.ts
│       ├── prisma-classroom.repository.ts
│       ├── in-memory-classroom.repository.ts
│       ├── prisma-classroom-member.repository.ts   # findMembersWithProfile: 2-query (member + user)
│       └── in-memory-classroom-member.repository.ts
├── presentation/
│   ├── teacher/teacher.controller.ts  # /teacher/organizations + /teacher/classrooms
│   └── student/student.controller.ts  # /me/classrooms
└── organization.module.ts             # seeds teacher + student roles on onModuleInit
```

## API Routes

### Teacher (`/teacher`) — JWT required
| Method | Path | Mô tả |
|---|---|---|
| POST | `/teacher/organizations` | Tạo tổ chức mới |
| GET | `/teacher/organizations` | Danh sách tổ chức của tôi |
| GET | `/teacher/organizations/:id` | Chi tiết tổ chức |
| PATCH | `/teacher/organizations/:id` | Đổi tên tổ chức |
| POST | `/teacher/classrooms` | Tạo lớp trong tổ chức |
| GET | `/teacher/classrooms` | Danh sách lớp tôi dạy |
| GET | `/teacher/classrooms/:id/report` | Báo cáo tiến độ thành viên |
| GET | `/teacher/classrooms/:id` | Chi tiết lớp học |
| DELETE | `/teacher/classrooms/:classroomId/members/:userId` | Xóa thành viên khỏi lớp |

> ⚠️ `/teacher/classrooms/:id/report` khai báo TRƯỚC `/teacher/classrooms/:id`

### Student (`/me/classrooms`) — JWT required
| Method | Path | Mô tả |
|---|---|---|
| GET | `/me/classrooms` | Danh sách lớp đã tham gia |
| POST | `/me/classrooms/join` | Tham gia lớp bằng invite code |

## Domain Model
- `Organization.create({ name, ownerId })` — tạo org mới
- `Organization.rename(name)` — đổi tên
- `Classroom.create({ orgId, teacherId, name, inviteCode })` — inviteCode = 8-char hex
- `Classroom.rename(name)` — đổi tên
- `ClassroomMember.create({ classroomId, userId })` — tham gia lớp

## Ownership Checks (trong use-cases)
- Teacher routes: kiểm tra `org.ownerId === teacherId` hoặc `classroom.teacherId === teacherId`
- Không dùng PermissionGuard — ownership check ở tầng use-case

## Invite Code
- Tạo bởi `randomBytes(4).toString('hex')` (8 ký tự hex)
- `@unique` trong DB → retry tối đa 5 lần nếu gặp Prisma P2002

## MemberReport (read model)
```ts
interface MemberReport {
  userId: string;
  joinedAt: Date;
  userName: string; // từ User.name, fallback userId
  xpTotal: number;  // từ User.xpTotal
}
```
`PrismaClassroomMemberRepository.findMembersWithProfile()` thực hiện 2 query:
1. `classroomMember.findMany({ where: { classroomId } })`
2. `user.findMany({ where: { id: { in: userIds } }, select: { id, name, xpTotal } })`

## Seeded Roles (subjectType: 'user')
| Role | Permissions |
|---|---|
| teacher | organizations (c/r/u), classrooms (c/r/u/d), classroom-members (d), classroom-reports (r) |
| student | classrooms (r), classroom-members (c) |

## Prisma Models
```
organizations (Organization): id, name, ownerId, createdAt
classrooms (Classroom): id, orgId, teacherId, name, inviteCode (unique), createdAt
classroom_members (ClassroomMember): classroomId + userId (composite PK), joinedAt
```
- `Classroom.members` → `ClassroomMember[]` (cascade delete)
- `ClassroomMember` không có relation trực tiếp đến User (query riêng khi cần profile)
