import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { ClassroomMember } from '../../domain/entities/classroom-member.entity';
import type {
  IClassroomMemberRepository,
  MemberReport,
} from '../../domain/repositories/classroom-member.repository';
import { ClassroomMemberMapper } from '../mappers/classroom-member.mapper';

@Injectable()
export class PrismaClassroomMemberRepository implements IClassroomMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMember(
    classroomId: string,
    userId: string,
  ): Promise<ClassroomMember | null> {
    const r = await this.prisma.classroomMember.findUnique({
      where: { classroomId_userId: { classroomId, userId } },
    });
    return r ? ClassroomMemberMapper.toDomain(r) : null;
  }

  async findMembersWithProfile(classroomId: string): Promise<MemberReport[]> {
    const members = await this.prisma.classroomMember.findMany({
      where: { classroomId },
      orderBy: { joinedAt: 'asc' },
    });

    if (members.length === 0) return [];

    const userIds = members.map((m) => m.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, xpTotal: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    return members.map((m) => {
      const user = userMap.get(m.userId);
      return {
        userId: m.userId,
        joinedAt: m.joinedAt,
        userName:
          [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
          m.userId,
        xpTotal: user?.xpTotal ?? 0,
      };
    });
  }

  async save(member: ClassroomMember): Promise<void> {
    await this.prisma.classroomMember.upsert({
      where: {
        classroomId_userId: {
          classroomId: member.classroomId,
          userId: member.userId,
        },
      },
      create: {
        classroomId: member.classroomId,
        userId: member.userId,
        joinedAt: member.joinedAt,
      },
      update: { joinedAt: member.joinedAt },
    });
  }

  async remove(classroomId: string, userId: string): Promise<void> {
    await this.prisma.classroomMember.delete({
      where: { classroomId_userId: { classroomId, userId } },
    });
  }
}
