# [BE] FEATURE PLAN — MODULE 6: organization (B2B — Phase 2)
> **Ngày:** 06/05/2026

---

## Mục đích

Hỗ trợ trường/trung tâm tiếng Nhật tạo lớp học, quản lý học viên, phân công bài tập và xem báo cáo tiến độ nhóm.

---

## Domain

Files:
- CREATE `be-base/src/modules/organization/domain/entities/organization.entity.ts` — id, name, ownerId, createdAt
- CREATE `be-base/src/modules/organization/domain/entities/classroom.entity.ts` — id, orgId, teacherId, name, inviteCode, createdAt
- CREATE `be-base/src/modules/organization/domain/entities/classroom-member.entity.ts` — classroomId, userId, joinedAt
- CREATE repositories cho organization, classroom, classroom-member

---

## Application

Files:
- CREATE `create-organization`, `get-organization`, `update-organization` use-cases
- CREATE `create-classroom`, `list-classrooms`, `get-classroom` use-cases
- CREATE `join-classroom-by-code.use-case.ts` — validate inviteCode, add member
- CREATE `get-classroom-report.use-case.ts` — aggregate progress data của members
- CREATE `remove-member.use-case.ts`

---

## Infrastructure + Presentation

- Teacher routes: `/teacher/organizations`, `/teacher/classrooms`
- Student routes: `/me/classrooms`

---

## Prisma Schema

```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String
  ownerId   String
  createdAt DateTime @default(now())

  classrooms Classroom[]
  @@map("organizations")
}

model Classroom {
  id         String   @id @default(uuid())
  orgId      String
  teacherId  String
  name       String
  inviteCode String   @unique
  createdAt  DateTime @default(now())

  org     Organization    @relation(fields: [orgId], references: [id])
  members ClassroomMember[]

  @@map("classrooms")
}

model ClassroomMember {
  classroomId String
  userId      String
  joinedAt    DateTime @default(now())

  classroom Classroom @relation(fields: [classroomId], references: [id], onDelete: Cascade)

  @@id([classroomId, userId])
  @@map("classroom_members")
}
```

**Migration name:** `create_organizations_and_classrooms`

---

## Edge Cases

- **Invite code collision:** dùng `nanoid(8)` + retry nếu gặp Prisma P2002
- **B2B role seeding:** Teacher role cần permission riêng (subjectType `user`) để không conflict với member role
