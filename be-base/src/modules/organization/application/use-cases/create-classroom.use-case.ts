import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Result } from '../../../../shared/application';
import { Classroom } from '../../domain/entities/classroom.entity';
import {
  CLASSROOM_REPOSITORY,
  type IClassroomRepository,
} from '../../domain/repositories/classroom.repository';
import {
  ORGANIZATION_REPOSITORY,
  type IOrganizationRepository,
} from '../../domain/repositories/organization.repository';

export interface CreateClassroomInput {
  orgId: string;
  teacherId: string;
  name: string;
}

export type CreateClassroomResult = Result<
  { classroomId: string; inviteCode: string },
  string
>;

function generateInviteCode(): string {
  return randomBytes(4).toString('hex');
}

@Injectable()
export class CreateClassroomUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly orgRepo: IOrganizationRepository,
    @Inject(CLASSROOM_REPOSITORY)
    private readonly classroomRepo: IClassroomRepository,
  ) {}

  async execute(input: CreateClassroomInput): Promise<CreateClassroomResult> {
    const org = await this.orgRepo.findById(input.orgId);
    if (!org) return { ok: false, error: 'Organization not found' };
    if (org.ownerId !== input.teacherId)
      return { ok: false, error: 'Forbidden' };

    let classroom!: Classroom;
    let attempts = 0;

    while (attempts < 5) {
      attempts++;
      classroom = Classroom.create({
        orgId: input.orgId,
        teacherId: input.teacherId,
        name: input.name,
        inviteCode: generateInviteCode(),
      });
      try {
        await this.classroomRepo.save(classroom);
        break;
      } catch (err: unknown) {
        if ((err as { code?: string }).code === 'P2002' && attempts < 5)
          continue;
        throw err;
      }
    }

    return {
      ok: true,
      value: {
        classroomId: classroom.id.value,
        inviteCode: classroom.inviteCode,
      },
    };
  }
}
