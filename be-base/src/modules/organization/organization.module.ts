import { Module, OnModuleInit } from '@nestjs/common';
import type { ClassProvider, ValueProvider } from '@nestjs/common';
import {
  AuthorizationService,
  type SeedRoleDefinition,
} from '../../core/authorization';
import { ADMIN_FEATURE } from '../../core/admin-shell/admin.interface';
import { ORGANIZATION_REPOSITORY } from './domain/repositories/organization.repository';
import { CLASSROOM_REPOSITORY } from './domain/repositories/classroom.repository';
import { CLASSROOM_MEMBER_REPOSITORY } from './domain/repositories/classroom-member.repository';
import { PrismaOrganizationRepository } from './infrastructure/repositories/prisma-organization.repository';
import { PrismaClassroomRepository } from './infrastructure/repositories/prisma-classroom.repository';
import { PrismaClassroomMemberRepository } from './infrastructure/repositories/prisma-classroom-member.repository';
import { CreateOrganizationUseCase } from './application/use-cases/create-organization.use-case';
import { ListOrganizationsUseCase } from './application/use-cases/list-organizations.use-case';
import { GetOrganizationUseCase } from './application/use-cases/get-organization.use-case';
import { UpdateOrganizationUseCase } from './application/use-cases/update-organization.use-case';
import { CreateClassroomUseCase } from './application/use-cases/create-classroom.use-case';
import { ListClassroomsUseCase } from './application/use-cases/list-classrooms.use-case';
import { ListMyClassroomsUseCase } from './application/use-cases/list-my-classrooms.use-case';
import { GetClassroomUseCase } from './application/use-cases/get-classroom.use-case';
import { JoinClassroomByCodeUseCase } from './application/use-cases/join-classroom-by-code.use-case';
import { GetClassroomReportUseCase } from './application/use-cases/get-classroom-report.use-case';
import { RemoveMemberUseCase } from './application/use-cases/remove-member.use-case';
import { AdminListOrganizationsUseCase } from './application/use-cases/admin-list-organizations.use-case';
import { AdminDeleteOrganizationUseCase } from './application/use-cases/admin-delete-organization.use-case';
import { AdminListClassroomsByOrgUseCase } from './application/use-cases/admin-list-classrooms-by-org.use-case';
import { AdminListMembersUseCase } from './application/use-cases/admin-list-members.use-case';
import { AdminRemoveMemberUseCase } from './application/use-cases/admin-remove-member.use-case';
import { TeacherController } from './presentation/teacher/teacher.controller';
import { StudentController } from './presentation/student/student.controller';
import { AdminOrganizationController } from './presentation/admin/admin-organization.controller';
import { AdminOrganizationFeature } from './presentation/admin/admin-organization.feature';

const ORG_ROLES: SeedRoleDefinition[] = [
  {
    name: 'teacher',
    subjectType: 'user',
    description: 'Giáo viên — tạo và quản lý lớp học, xem báo cáo tiến độ',
    permissions: {
      organizations: ['create', 'read', 'update'],
      classrooms: ['create', 'read', 'update', 'delete'],
      'classroom-members': ['delete'],
      'classroom-reports': ['read'],
    },
  },
  {
    name: 'student',
    subjectType: 'user',
    description: 'Học viên — tham gia lớp học qua invite code',
    permissions: {
      classrooms: ['read'],
      'classroom-members': ['create'],
    },
  },
];

@Module({
  controllers: [
    TeacherController,
    StudentController,
    AdminOrganizationController,
  ],
  providers: [
    {
      provide: ORGANIZATION_REPOSITORY,
      useClass: PrismaOrganizationRepository,
    } as ClassProvider,
    {
      provide: CLASSROOM_REPOSITORY,
      useClass: PrismaClassroomRepository,
    } as ClassProvider,
    {
      provide: CLASSROOM_MEMBER_REPOSITORY,
      useClass: PrismaClassroomMemberRepository,
    } as ClassProvider,
    {
      provide: ADMIN_FEATURE,
      useValue: AdminOrganizationFeature,
      multi: true,
    } as ValueProvider,
    CreateOrganizationUseCase,
    ListOrganizationsUseCase,
    GetOrganizationUseCase,
    UpdateOrganizationUseCase,
    CreateClassroomUseCase,
    ListClassroomsUseCase,
    ListMyClassroomsUseCase,
    GetClassroomUseCase,
    JoinClassroomByCodeUseCase,
    GetClassroomReportUseCase,
    RemoveMemberUseCase,
    AdminListOrganizationsUseCase,
    AdminDeleteOrganizationUseCase,
    AdminListClassroomsByOrgUseCase,
    AdminListMembersUseCase,
    AdminRemoveMemberUseCase,
  ],
})
export class OrganizationModule implements OnModuleInit {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async onModuleInit(): Promise<void> {
    await this.authorizationService.seedRoles(ORG_ROLES);
  }
}
