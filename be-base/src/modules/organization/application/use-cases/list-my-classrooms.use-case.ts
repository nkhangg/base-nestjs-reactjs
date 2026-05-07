import { Inject, Injectable } from '@nestjs/common';
import type { Classroom } from '../../domain/entities/classroom.entity';
import {
  CLASSROOM_REPOSITORY,
  type IClassroomRepository,
} from '../../domain/repositories/classroom.repository';

export interface ListMyClassroomsInput {
  userId: string;
  page: number;
  pageSize: number;
}

@Injectable()
export class ListMyClassroomsUseCase {
  constructor(
    @Inject(CLASSROOM_REPOSITORY)
    private readonly classroomRepo: IClassroomRepository,
  ) {}

  async execute(
    input: ListMyClassroomsInput,
  ): Promise<{ data: Classroom[]; total: number }> {
    return this.classroomRepo.listByMember(
      input.userId,
      input.page,
      input.pageSize,
    );
  }
}
