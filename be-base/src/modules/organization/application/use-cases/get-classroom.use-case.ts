import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import type { Classroom } from '../../domain/entities/classroom.entity';
import {
  CLASSROOM_REPOSITORY,
  type IClassroomRepository,
} from '../../domain/repositories/classroom.repository';

export interface GetClassroomInput {
  classroomId: string;
  teacherId: string;
}

export type GetClassroomResult = Result<Classroom, string>;

@Injectable()
export class GetClassroomUseCase {
  constructor(
    @Inject(CLASSROOM_REPOSITORY)
    private readonly classroomRepo: IClassroomRepository,
  ) {}

  async execute(input: GetClassroomInput): Promise<GetClassroomResult> {
    const classroom = await this.classroomRepo.findById(input.classroomId);
    if (!classroom) return { ok: false, error: 'Classroom not found' };
    if (classroom.teacherId !== input.teacherId)
      return { ok: false, error: 'Forbidden' };
    return { ok: true, value: classroom };
  }
}
