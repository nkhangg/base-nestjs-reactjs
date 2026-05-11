import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Result } from '../../../../shared/application';
import { CreateUserUseCase } from '../../../../modules/user/application/use-cases/create-user.use-case';
import { Session } from '../../domain/entities/session.entity';
import { DeviceInfo } from '../../domain/value-objects/device-info.vo';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../domain/repositories/session.repository';
import {
  TOKEN_SERVICE,
  type ITokenService,
} from '../../domain/services/token.service';
import type { LoginOutput } from './login.use-case';

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    private readonly createUserUseCase: CreateUserUseCase,
  ) {}

  async execute(input: RegisterInput): Promise<Result<LoginOutput>> {
    const createResult = await this.createUserUseCase.execute({
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    if (!createResult.ok) {
      if (createResult.error === 'EMAIL_ALREADY_EXISTS') {
        return Result.fail(new ConflictException('Email đã được sử dụng'));
      }
      return Result.fail(
        new InternalServerErrorException('Không thể tạo tài khoản'),
      );
    }

    const { userId } = createResult.value;

    const deviceInfo = DeviceInfo.create({
      deviceName: input.deviceName,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    const refreshToken = this.tokenService.generateRefreshToken();
    const sessionId = randomUUID();

    const session = Session.create({
      id: sessionId,
      userId,
      userEmail: input.email,
      userType: 'user',
      isAdmin: false,
      refreshTokenHash: this.tokenService.hashToken(refreshToken),
      deviceInfo,
      expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
    });

    await this.sessionRepo.save(session);

    const accessToken = this.tokenService.signAccessToken({
      sub: userId,
      sessionId,
      email: input.email,
      type: 'user',
      isAdmin: false,
    });

    return Result.ok({ accessToken, refreshToken, sessionId });
  }
}
