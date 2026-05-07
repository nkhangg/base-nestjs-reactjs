import type { Classroom } from '../../domain/entities/classroom.entity';
import type { IClassroomRepository } from '../../domain/repositories/classroom.repository';

export class InMemoryClassroomRepository implements IClassroomRepository {
  private readonly store = new Map<string, Classroom>();
  readonly memberMap = new Map<string, Set<string>>();

  async findById(id: string): Promise<Classroom | null> {
    return this.store.get(id) ?? null;
  }

  async findByInviteCode(code: string): Promise<Classroom | null> {
    for (const c of this.store.values()) {
      if (c.inviteCode === code) return c;
    }
    return null;
  }

  async listByTeacher(
    teacherId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Classroom[]; total: number }> {
    const results = Array.from(this.store.values())
      .filter((c) => c.teacherId === teacherId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const skip = (page - 1) * pageSize;
    return { data: results.slice(skip, skip + pageSize), total };
  }

  async listByMember(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Classroom[]; total: number }> {
    const memberClassroomIds = new Set<string>();
    for (const [classroomId, members] of this.memberMap.entries()) {
      if (members.has(userId)) memberClassroomIds.add(classroomId);
    }

    const results = Array.from(this.store.values())
      .filter((c) => memberClassroomIds.has(c.id.value))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const skip = (page - 1) * pageSize;
    return { data: results.slice(skip, skip + pageSize), total };
  }

  async listByOrg(
    orgId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Classroom[]; total: number }> {
    const results = Array.from(this.store.values())
      .filter((c) => c.orgId === orgId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = results.length;
    const skip = (page - 1) * pageSize;
    return { data: results.slice(skip, skip + pageSize), total };
  }

  async save(classroom: Classroom): Promise<void> {
    this.store.set(classroom.id.value, classroom);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
    this.memberMap.delete(id);
  }

  addMember(classroomId: string, userId: string): void {
    if (!this.memberMap.has(classroomId))
      this.memberMap.set(classroomId, new Set());
    this.memberMap.get(classroomId)!.add(userId);
  }

  removeMember(classroomId: string, userId: string): void {
    this.memberMap.get(classroomId)?.delete(userId);
  }
}
