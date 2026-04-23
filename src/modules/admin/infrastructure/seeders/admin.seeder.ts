import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import type { IAdminRepository } from '../../domain/repositories/admin.repository';
import { ADMIN_REPOSITORY } from '../../domain/repositories/admin.repository';
import type { ITokenService } from '../../../../core/auth/domain/services/token.service';
import { TOKEN_SERVICE } from '../../../../core/auth/domain/services/token.service';
import { Admin } from '../../domain/entities/admin.entity';

const ROLES = ['super-admin', 'admin', 'editor', 'moderator', 'viewer'];

const SEED_ADMINS = [
  { email: 'alice@example.com', role: 'super-admin', active: true },
  { email: 'bob@example.com', role: 'admin', active: true },
  { email: 'charlie@example.com', role: 'editor', active: true },
  { email: 'diana@example.com', role: 'moderator', active: true },
  { email: 'evan@example.com', role: 'viewer', active: true },
  { email: 'fiona@example.com', role: 'admin', active: false },
  { email: 'george@example.com', role: 'editor', active: true },
  { email: 'helen@example.com', role: 'moderator', active: false },
  { email: 'ivan@example.com', role: 'viewer', active: true },
  { email: 'julia@example.com', role: 'super-admin', active: true },
  { email: 'kevin@example.com', role: 'admin', active: true },
  { email: 'laura@example.com', role: 'editor', active: false },
  { email: 'mike@example.com', role: 'moderator', active: true },
  { email: 'nina@example.com', role: 'viewer', active: true },
  { email: 'oscar@example.com', role: 'admin', active: true },
  { email: 'paula@example.com', role: 'editor', active: true },
  { email: 'quinn@example.com', role: 'moderator', active: false },
  { email: 'rachel@example.com', role: 'viewer', active: true },
  { email: 'sam@example.com', role: 'admin', active: true },
  { email: 'tina@example.com', role: 'editor', active: true },
  { email: 'uma@example.com', role: 'moderator', active: true },
  { email: 'victor@example.com', role: 'viewer', active: false },
  { email: 'wendy@example.com', role: 'admin', active: true },
  { email: 'xander@example.com', role: 'editor', active: true },
  { email: 'yara@example.com', role: 'moderator', active: true },
  { email: 'zoe@example.com', role: 'viewer', active: true },
  { email: 'aaron@example.com', role: 'admin', active: false },
  { email: 'bella@example.com', role: 'editor', active: true },
  { email: 'carl@example.com', role: 'moderator', active: true },
  { email: 'daisy@example.com', role: 'viewer', active: true },
  { email: 'eli@example.com', role: 'admin', active: true },
  { email: 'faith@example.com', role: 'editor', active: false },
  { email: 'gabe@example.com', role: 'moderator', active: true },
  { email: 'hana@example.com', role: 'viewer', active: true },
  { email: 'igor@example.com', role: 'admin', active: true },
  { email: 'jade@example.com', role: 'editor', active: true },
  { email: 'kyle@example.com', role: 'moderator', active: true },
  { email: 'lena@example.com', role: 'viewer', active: false },
  { email: 'max@example.com', role: 'admin', active: true },
  { email: 'nova@example.com', role: 'editor', active: true },
  { email: 'otto@example.com', role: 'moderator', active: true },
  { email: 'pia@example.com', role: 'viewer', active: true },
  { email: 'ray@example.com', role: 'admin', active: false },
  { email: 'sara@example.com', role: 'editor', active: true },
  { email: 'tom@example.com', role: 'moderator', active: true },
  { email: 'uri@example.com', role: 'viewer', active: true },
  { email: 'vera@example.com', role: 'admin', active: true },
  { email: 'will@example.com', role: 'editor', active: false },
  { email: 'xena@example.com', role: 'moderator', active: true },
  { email: 'yvonne@example.com', role: 'viewer', active: true },
];

// Ensure ROLES is used (for import validation)
const _roles: string[] = ROLES;
void _roles;

@Injectable()
export class AdminSeeder implements OnModuleInit {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedSuperAdmin();
    await this.seedTestAdmins();
  }

  private async seedSuperAdmin(): Promise<void> {
    const email = process.env.ADMIN_SEED_EMAIL;
    const password = process.env.ADMIN_SEED_PASSWORD;
    const role = process.env.ADMIN_SEED_ROLE ?? 'super-admin';

    if (!email || !password) return;

    const existing = await this.adminRepo.findByEmail(email);
    if (existing) {
      this.logger.log(`Seed admin already exists: ${email}`);
      return;
    }

    const admin = Admin.create({
      email,
      passwordHash: this.tokenService.hashToken(password),
      role,
    });

    await this.adminRepo.save(admin);
    this.logger.log(`Seed admin created: ${email} (role: ${role})`);
  }

  private async seedTestAdmins(): Promise<void> {
    if (process.env.NODE_ENV === 'production') return;

    const defaultHash = this.tokenService.hashToken('Test@1234');
    let created = 0;

    for (const seed of SEED_ADMINS) {
      const existing = await this.adminRepo.findByEmail(seed.email);
      if (existing) continue;

      const admin = Admin.create({
        email: seed.email,
        passwordHash: defaultHash,
        role: seed.role,
      });

      if (!seed.active) admin.deactivate();

      await this.adminRepo.save(admin);
      created++;
    }

    if (created > 0) {
      this.logger.log(`Seeded ${created} test admins (password: Test@1234)`);
    }
  }
}
