import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  CLASSROOM_MEMBER_REPOSITORY,
  type IClassroomMemberRepository,
  type MemberReport,
} from '../../domain/repositories/classroom-member.repository';
import {
  CLASSROOM_REPOSITORY,
  type IClassroomRepository,
} from '../../domain/repositories/classroom.repository';

export interface GetClassroomReportInput {
  classroomId: string;
  teacherId: string;
}

export type GetClassroomReportResult = Result<MemberReport[], string>;

@Injectable()
export class GetClassroomReportUseCase {
  constructor(
    @Inject(CLASSROOM_REPOSITORY)
    private readonly classroomRepo: IClassroomRepository,
    @Inject(CLASSROOM_MEMBER_REPOSITORY)
    private readonly memberRepo: IClassroomMemberRepository,
  ) {}

  async execute(
    input: GetClassroomReportInput,
  ): Promise<GetClassroomReportResult> {
    const classroom = await this.classroomRepo.findById(input.classroomId);
    if (!classroom) return { ok: false, error: 'Classroom not found' };
    if (classroom.teacherId !== input.teacherId)
      return { ok: false, error: 'Forbidden' };

    const members = await this.memberRepo.findMembersWithProfile(
      input.classroomId,
    );
    return { ok: true, value: members };
  }
}
