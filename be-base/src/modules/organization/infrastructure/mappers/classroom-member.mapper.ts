import { ClassroomMember } from '../../domain/entities/classroom-member.entity';

interface ClassroomMemberRecord {
  classroomId: string;
  userId: string;
  joinedAt: Date;
}

export class ClassroomMemberMapper {
  static toDomain(r: ClassroomMemberRecord): ClassroomMember {
    return ClassroomMember.reconstitute({
      classroomId: r.classroomId,
      userId: r.userId,
      joinedAt: r.joinedAt,
    });
  }
}
