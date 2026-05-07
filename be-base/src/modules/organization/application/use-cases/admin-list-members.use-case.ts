import { Inject, Injectable } from '@nestjs/common';
import {
  CLASSROOM_MEMBER_REPOSITORY,
  type IClassroomMemberRepository,
  type MemberReport,
} from '../../domain/repositories/classroom-member.repository';

@Injectable()
export class AdminListMembersUseCase {
  constructor(
    @Inject(CLASSROOM_MEMBER_REPOSITORY)
    private readonly memberRepo: IClassroomMemberRepository,
  ) {}

  async execute(classroomId: string): Promise<MemberReport[]> {
    return this.memberRepo.findMembersWithProfile(classroomId);
  }
}
