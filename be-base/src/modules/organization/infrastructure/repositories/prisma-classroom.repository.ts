import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { Classroom } from '../../domain/entities/classroom.entity';
import type { IClassroomRepository } from '../../domain/repositories/classroom.repository';
import { ClassroomMapper } from '../mappers/classroom.mapper';

@Injectable()
export class PrismaClassroomRepository implements IClassroomRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Classroom | null> {
    const r = await this.prisma.classroom.findUnique({ where: { id } });
    return r ? ClassroomMapper.toDomain(r) : null;
  }

  async findByInviteCode(code: string): Promise<Classroom | null> {
    const r = await this.prisma.classroom.findUnique({
      where: { inviteCode: code },
    });
    return r ? ClassroomMapper.toDomain(r) : null;
  }

  async listByTeacher(
    teacherId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Classroom[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.classroom.findMany({
        where: { teacherId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.classroom.count({ where: { teacherId } }),
    ]);
    return { data: rows.map(ClassroomMapper.toDomain), total };
  }

  async listByMember(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Classroom[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.classroom.findMany({
        where: { members: { some: { userId } } },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.classroom.count({ where: { members: { some: { userId } } } }),
    ]);
    return { data: rows.map(ClassroomMapper.toDomain), total };
  }

  async listByOrg(
    orgId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Classroom[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.classroom.findMany({
        where: { orgId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.classroom.count({ where: { orgId } }),
    ]);
    return { data: rows.map(ClassroomMapper.toDomain), total };
  }

  async save(classroom: Classroom): Promise<void> {
    const data = {
      orgId: classroom.orgId,
      teacherId: classroom.teacherId,
      name: classroom.name,
      inviteCode: classroom.inviteCode,
      createdAt: classroom.createdAt,
    };
    await this.prisma.classroom.upsert({
      where: { id: classroom.id.value },
      create: { id: classroom.id.value, ...data },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.classroom.delete({ where: { id } });
  }
}
