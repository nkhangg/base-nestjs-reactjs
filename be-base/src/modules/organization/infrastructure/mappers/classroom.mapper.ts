import { Classroom } from '../../domain/entities/classroom.entity';

interface ClassroomRecord {
  id: string;
  orgId: string;
  teacherId: string;
  name: string;
  inviteCode: string;
  createdAt: Date;
}

export class ClassroomMapper {
  static toDomain(r: ClassroomRecord): Classroom {
    return Classroom.reconstitute(r.id, {
      orgId: r.orgId,
      teacherId: r.teacherId,
      name: r.name,
      inviteCode: r.inviteCode,
      createdAt: r.createdAt,
    });
  }
}
