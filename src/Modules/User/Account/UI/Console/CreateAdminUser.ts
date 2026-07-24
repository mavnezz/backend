import { randomUUID } from 'crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../../../app.module';
import { UserAccountStatus } from '../../Domain/Enums/UserAccountStatus';
import { UserRole } from '../../Domain/Enums/UserRole';
import { UserAccount } from '../../Domain/Models/UserAccount';
import { PASSWORD_HASHER, PasswordHasher } from '../../Domain/Ports/PasswordHasher';
import {
  USER_ACCOUNT_REPOSITORY,
  UserAccountRepository,
} from '../../Domain/Ports/UserAccountRepository';

/**
 * CLI-Seeder: legt ein Admin-Konto an.
 * Aufruf: `npm run seed:admin -- <email> <password>`
 */
async function bootstrap(): Promise<void> {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: npm run seed:admin -- <email> <password>');
    process.exitCode = 1;
    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const accounts = app.get<UserAccountRepository>(USER_ACCOUNT_REPOSITORY);
    const hasher = app.get<PasswordHasher>(PASSWORD_HASHER);
    const normalizedEmail = email.trim().toLowerCase();

    if (await accounts.existsByEmail(normalizedEmail)) {
      console.error(`Account '${normalizedEmail}' already exists.`);
      process.exitCode = 1;
      return;
    }

    const admin = new UserAccount();
    admin.id = randomUUID();
    admin.email = normalizedEmail;
    admin.passwordHash = await hasher.hash(password);
    admin.status = UserAccountStatus.ACTIVE;
    admin.roles = [UserRole.ADMIN];
    const saved = await accounts.save(admin);

    console.log(`Admin account created: ${saved.id} (${saved.email})`);
  } finally {
    await app.close();
  }
}

void bootstrap();
