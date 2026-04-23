import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type IUserRepository,
  type FindAllUsersOptions,
} from '../../domain/repositories/user.repository';
import type { User } from '../../domain/entities/user.entity';

export type ListUsersInput = FindAllUsersOptions;

export interface ListUsersOutput {
  data: User[];
  total: number;
}

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  execute(input: ListUsersInput = {}): Promise<ListUsersOutput> {
    return this.userRepo.findAll(input);
  }
}
