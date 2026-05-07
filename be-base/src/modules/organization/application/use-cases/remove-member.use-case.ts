import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  CLASSROOM_MEMBER_REPOSITORY,
  type IClassroomMemberRepository,
} from '../../domain/repositories/classroom-member.repository';
import {
  CLASSROOM_REPOSITORY,
  type IClassroomRepository,
} from '../../domain/repositories/classroom.repository';

export interface RemoveMemberInput {
  classroomId: string;
  userId: string;
  teacherId: string;
}

export type RemoveMemberResult = Result<void, string>;

@Injectable()
export class RemoveMemberUseCase {
  constructor(
    @Inject(CLASSROOM_REPOSITORY)
    private readonly classroomRepo: IClassroomRepository,
    @Inject(CLASSROOM_MEMBER_REPOSITORY)
    private readonly memberRepo: IClassroomMemberRepository,
  ) {}

  async execute(input: RemoveMemberInput): Promise<RemoveMemberResult> {
    const classroom = await this.classroomRepo.findById(input.classroomId);
    if (!classroom) return { ok: false, error: 'Classroom not found' };
    if (classroom.teacherId !== input.teacherId)
      return { ok: false, error: 'Forbidden' };

    const member = await this.memberRepo.findMember(
      input.classroomId,
      input.userId,
    );
    if (!member) return { ok: false, error: 'Member not found' };

    await this.memberRepo.remove(input.classroomId, input.userId);
    return { ok: true, value: undefined };
  }
}
