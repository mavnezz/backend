import { randomUUID } from 'crypto';
import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserAccountStatus } from '../Domain/Enums/UserAccountStatus';
import { UserRole } from '../Domain/Enums/UserRole';
import { UserAccount } from '../Domain/Models/UserAccount';
import { PASSWORD_HASHER, PasswordHasher } from '../Domain/Ports/PasswordHasher';
import {
  USER_ACCOUNT_REPOSITORY,
  UserAccountRepository,
} from '../Domain/Ports/UserAccountRepository';
import { UserAccountPolicy } from '../Domain/Service/UserAccountPolicy';

/**
 * Legt beim Boot automatisch ein initiales Admin-Konto an — gesteuert über
 * `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Ohne diese Variablen passiert nichts.
 * Idempotent: existiert die E-Mail bereits, wird nichts angelegt.
 */
@Injectable()
export class AdminAccountSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminAccountSeeder.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(USER_ACCOUNT_REPOSITORY) private readonly accounts: UserAccountRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly policy: UserAccountPolicy,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) {
      return;
    }

    const normalizedEmail = this.policy.normalizeEmail(email);
    if (await this.accounts.existsByEmail(normalizedEmail)) {
      return;
    }

    const admin = new UserAccount();
    admin.id = randomUUID();
    admin.email = normalizedEmail;
    admin.passwordHash = await this.hasher.hash(password);
    admin.status = UserAccountStatus.ACTIVE;
    admin.roles = [UserRole.ADMIN];
    await this.accounts.save(admin);

    this.logger.log(`Seeded initial admin account '${normalizedEmail}'.`);
  }
}
