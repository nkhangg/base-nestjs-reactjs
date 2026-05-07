import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import { ClassroomMember } from '../../domain/entities/classroom-member.entity';
import {
  CLASSROOM_MEMBER_REPOSITORY,
  type IClassroomMemberRepository,
} from '../../domain/repositories/classroom-member.repository';
import {
  CLASSROOM_REPOSITORY,
  type IClassroomRepository,
} from '../../domain/repositories/classroom.repository';

export interface JoinClassroomByCodeInput {
  inviteCode: string;
  userId: string;
}

export type JoinClassroomByCodeResult = Result<{ classroomId: string }, string>;

@Injectable()
export class JoinClassroomByCodeUseCase {
  constructor(
    @Inject(CLASSROOM_REPOSITORY)
    private readonly classroomRepo: IClassroomRepository,
    @Inject(CLASSROOM_MEMBER_REPOSITORY)
    private readonly memberRepo: IClassroomMemberRepository,
  ) {}

  async execute(
    input: JoinClassroomByCodeInput,
  ): Promise<JoinClassroomByCodeResult> {
    const classroom = await this.classroomRepo.findByInviteCode(
      input.inviteCode,
    );
    if (!classroom) return { ok: false, error: 'Invalid invite code' };

    const existing = await this.memberRepo.findMember(
      classroom.id.value,
      input.userId,
    );
    if (existing) return { ok: false, error: 'Already a member' };

    const member = ClassroomMember.create({
      classroomId: classroom.id.value,
      userId: input.userId,
    });
    await this.memberRepo.save(member);
    return { ok: true, value: { classroomId: classroom.id.value } };
  }
}
