import { Inject, Injectable } from '@nestjs/common';
import type { Classroom } from '../../domain/entities/classroom.entity';
import {
  CLASSROOM_REPOSITORY,
  type IClassroomRepository,
} from '../../domain/repositories/classroom.repository';

export interface ListClassroomsInput {
  teacherId: string;
  page: number;
  pageSize: number;
}

@Injectable()
export class ListClassroomsUseCase {
  constructor(
    @Inject(CLASSROOM_REPOSITORY)
    private readonly classroomRepo: IClassroomRepository,
  ) {}

  async execute(
    input: ListClassroomsInput,
  ): Promise<{ data: Classroom[]; total: number }> {
    return this.classroomRepo.listByTeacher(
      input.teacherId,
      input.page,
      input.pageSize,
    );
  }
}
