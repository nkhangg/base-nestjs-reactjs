import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  CLASSROOM_MEMBER_REPOSITORY,
  type IClassroomMemberRepository,
} from '../../domain/repositories/classroom-member.repository';

export type AdminRemoveMemberResult = Result<void, string>;

@Injectable()
export class AdminRemoveMemberUseCase {
  constructor(
    @Inject(CLASSROOM_MEMBER_REPOSITORY)
    private readonly memberRepo: IClassroomMemberRepository,
  ) {}

  async execute(
    classroomId: string,
    userId: string,
  ): Promise<AdminRemoveMemberResult> {
    const member = await this.memberRepo.findMember(classroomId, userId);
    if (!member) return { ok: false, error: 'Member not found' };
    await this.memberRepo.remove(classroomId, userId);
    return { ok: true, value: undefined };
  }
}
