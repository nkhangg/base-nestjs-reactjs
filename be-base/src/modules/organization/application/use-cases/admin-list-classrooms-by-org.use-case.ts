import { Inject, Injectable } from '@nestjs/common';
import type { Classroom } from '../../domain/entities/classroom.entity';
import {
  CLASSROOM_REPOSITORY,
  type IClassroomRepository,
} from '../../domain/repositories/classroom.repository';

export interface AdminListClassroomsByOrgInput {
  orgId: string;
  page: number;
  pageSize: number;
}

@Injectable()
export class AdminListClassroomsByOrgUseCase {
  constructor(
    @Inject(CLASSROOM_REPOSITORY)
    private readonly classroomRepo: IClassroomRepository,
  ) {}

  async execute(
    input: AdminListClassroomsByOrgInput,
  ): Promise<{ data: Classroom[]; total: number }> {
    return this.classroomRepo.listByOrg(
      input.orgId,
      input.page,
      input.pageSize,
    );
  }
}
