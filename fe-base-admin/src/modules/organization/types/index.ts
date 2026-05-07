export interface Organization {
  id: string
  name: string
  ownerId: string
  createdAt: string
}

export interface Classroom {
  id: string
  orgId: string
  teacherId: string
  name: string
  inviteCode: string
  createdAt: string
}

export interface MemberReport {
  userId: string
  joinedAt: string
  userName: string
  xpTotal: number
}

export interface OrgListResponse {
  data: Organization[]
  total: number
}

export interface ClassroomListResponse {
  data: Classroom[]
  total: number
}

export interface MemberListResponse {
  data: MemberReport[]
}

export interface ClassroomReportResponse {
  classroomId: string
  classroomName: string
  data: MemberReport[]
}
