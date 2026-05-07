import type { ClassroomMember } from '../../domain/entities/classroom-member.entity';
import type {
  IClassroomMemberRepository,
  MemberReport,
} from '../../domain/repositories/classroom-member.repository';

export class InMemoryClassroomMemberRepository implements IClassroomMemberRepository {
  private readonly store = new Map<string, ClassroomMember>();

  private key(classroomId: string, userId: string): string {
    return `${classroomId}::${userId}`;
  }

  async findMember(
    classroomId: string,
    userId: string,
  ): Promise<ClassroomMember | null> {
    return this.store.get(this.key(classroomId, userId)) ?? null;
  }

  async findMembersWithProfile(classroomId: string): Promise<MemberReport[]> {
    return Array.from(this.store.values())
      .filter((m) => m.classroomId === classroomId)
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())
      .map((m) => ({
        userId: m.userId,
        joinedAt: m.joinedAt,
        userName: m.userId,
        xpTotal: 0,
      }));
  }

  async save(member: ClassroomMember): Promise<void> {
    this.store.set(this.key(member.classroomId, member.userId), member);
  }

  async remove(classroomId: string, userId: string): Promise<void> {
    this.store.delete(this.key(classroomId, userId));
  }
}
