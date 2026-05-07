import type { Classroom } from '../entities/classroom.entity';

export const CLASSROOM_REPOSITORY = Symbol('CLASSROOM_REPOSITORY');

export interface IClassroomRepository {
  findById(id: string): Promise<Classroom | null>;
  findByInviteCode(code: string): Promise<Classroom | null>;
  listByTeacher(
    teacherId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Classroom[]; total: number }>;
  listByMember(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Classroom[]; total: number }>;
  listByOrg(
    orgId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Classroom[]; total: number }>;
  save(classroom: Classroom): Promise<void>;
  delete(id: string): Promise<void>;
}
