import type { ClassroomMember } from '../entities/classroom-member.entity';

export const CLASSROOM_MEMBER_REPOSITORY = Symbol(
  'CLASSROOM_MEMBER_REPOSITORY',
);

export interface MemberReport {
  userId: string;
  joinedAt: Date;
  userName: string;
  xpTotal: number;
}

export interface IClassroomMemberRepository {
  findMember(
    classroomId: string,
    userId: string,
  ): Promise<ClassroomMember | null>;
  findMembersWithProfile(classroomId: string): Promise<MemberReport[]>;
  save(member: ClassroomMember): Promise<void>;
  remove(classroomId: string, userId: string): Promise<void>;
}
