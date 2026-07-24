import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { InitAuthorization1721000001000 } from '../../../../../migrations/1721000001000-InitAuthorization';
import { InitUserAccounts1721000000000 } from '../../../../../migrations/1721000000000-InitUserAccounts';
import { Permission } from '../../../../../Shared/Authorization/Domain/Permission';
import { Role } from '../../../../../Shared/Authorization/Domain/Role';
import { SharedModule } from '../../../../../Shared/SharedModule';
import { UserAccountStatus } from '../../Domain/Enums/UserAccountStatus';
import { UserRole } from '../../Domain/Enums/UserRole';
import { UserAccount } from '../../Domain/Models/UserAccount';
import { PASSWORD_HASHER, PasswordHasher } from '../../Domain/Ports/PasswordHasher';
import {
  USER_ACCOUNT_REPOSITORY,
  UserAccountRepository,
} from '../../Domain/Ports/UserAccountRepository';
import { UserAccountModule } from '../../UserAccountModule';

/**
 * Feature-Test: fährt die komplette App gegen eine SQLite-In-Memory-DB hoch
 * (Migrations laufen, Boot-Seeder entdeckt die Route-Permissions) und übt
 * Registrierung, Login, Validierung, Fehler-Format und RBAC end-to-end.
 */
describe('User/Account (feature)', () => {
  let app: INestApplication;

  const user = { email: 'jane@example.com', password: 'password123' };
  const admin = { email: 'admin@example.com', password: 'admin-password' };

  let userId: string;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [UserAccount, Permission, Role],
          migrations: [InitUserAccounts1721000000000, InitAuthorization1721000001000],
          migrationsRun: true,
          synchronize: false,
          dropSchema: true,
        }),
        SharedModule,
        UserAccountModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Admin-Konto direkt über den Port anlegen. Die 'admin'-Rolle bekommt beim
    // Boot automatisch alle im Code entdeckten Permissions zugeordnet.
    const accounts = app.get<UserAccountRepository>(USER_ACCOUNT_REPOSITORY);
    const hasher = app.get<PasswordHasher>(PASSWORD_HASHER);
    const adminAccount = new UserAccount();
    adminAccount.id = randomUUID();
    adminAccount.email = admin.email;
    adminAccount.passwordHash = await hasher.hash(admin.password);
    adminAccount.status = UserAccountStatus.ACTIVE;
    adminAccount.roles = [UserRole.ADMIN];
    await accounts.save(adminAccount);
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a new account (public) → 201', async () => {
    const res = await request(app.getHttpServer()).post('/accounts').send(user).expect(201);
    expect(res.body.id).toEqual(expect.any(String));
    userId = res.body.id;
  });

  it('rejects a duplicate email → 409 EMAIL_ALREADY_IN_USE', async () => {
    const res = await request(app.getHttpServer()).post('/accounts').send(user).expect(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_IN_USE');
  });

  it('rejects invalid input → 400 VALIDATION_ERROR', async () => {
    const res = await request(app.getHttpServer())
      .post('/accounts')
      .send({ email: 'not-an-email', password: 'x' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it('blocks the protected route without a token → 401', async () => {
    await request(app.getHttpServer()).get(`/accounts/${userId}`).expect(401);
  });

  it('logs the user in → 200 + JWT', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login').send(user).expect(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    userToken = res.body.accessToken;
  });

  it('returns the current user for an authenticated request (/auth/me)', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(res.body).toMatchObject({ email: user.email, roles: ['user'], permissions: [] });
  });

  it('forbids the user without the required permission → 403 FORBIDDEN', async () => {
    const res = await request(app.getHttpServer())
      .get(`/accounts/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('lets the admin read the account (auto-granted permission) → 200', async () => {
    const login = await request(app.getHttpServer()).post('/auth/login').send(admin).expect(200);
    adminToken = login.body.accessToken;

    const res = await request(app.getHttpServer())
      .get(`/accounts/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body).toMatchObject({
      id: userId,
      email: user.email,
      status: 'active',
      roles: ['user'],
    });
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('rejects a wrong password → 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'wrong-password' })
      .expect(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
