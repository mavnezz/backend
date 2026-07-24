import { JwtService } from '@nestjs/jwt';
import { PermissionResolver } from '../../../../../Shared/Authorization/PermissionResolver';
import { LoginCommand } from '../../Application/Command/LoginCommand';
import { LoginHandler } from '../../Application/Command/LoginHandler';
import { UserAccountStatus } from '../../Domain/Enums/UserAccountStatus';
import { UserRole } from '../../Domain/Enums/UserRole';
import { InvalidCredentialsException } from '../../Domain/Exceptions/InvalidCredentialsException';
import { PasswordHasher } from '../../Domain/Ports/PasswordHasher';
import { UserAccount } from '../../Domain/Models/UserAccount';
import { UserAccountRepository } from '../../Domain/Ports/UserAccountRepository';
import { UserAccountPolicy } from '../../Domain/Service/UserAccountPolicy';

const activeAccount = () =>
  Object.assign(new UserAccount(), {
    id: 'u1',
    email: 'a@b.com',
    passwordHash: 'hash',
    status: UserAccountStatus.ACTIVE,
    roles: [UserRole.USER],
  });

describe('LoginHandler', () => {
  let accounts: jest.Mocked<UserAccountRepository>;
  let hasher: jest.Mocked<PasswordHasher>;
  let jwt: jest.Mocked<JwtService>;
  let resolver: jest.Mocked<PermissionResolver>;
  let handler: LoginHandler;

  beforeEach(() => {
    accounts = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserAccountRepository>;
    hasher = { hash: jest.fn(), compare: jest.fn() } as unknown as jest.Mocked<PasswordHasher>;
    jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt') } as unknown as jest.Mocked<JwtService>;
    resolver = {
      resolveForRoles: jest.fn().mockResolvedValue(['user-account:read']),
    } as unknown as jest.Mocked<PermissionResolver>;
    handler = new LoginHandler(accounts, hasher, new UserAccountPolicy(), jwt, resolver);
  });

  it('returns a token with resolved permissions for valid credentials', async () => {
    accounts.findByEmail.mockResolvedValue(activeAccount());
    hasher.compare.mockResolvedValue(true);

    const result = await handler.execute(new LoginCommand('A@B.com', 'password123'));

    expect(result.accessToken).toBe('signed.jwt');
    expect(resolver.resolveForRoles).toHaveBeenCalledWith([UserRole.USER]);
    const payload = jwt.signAsync.mock.calls[0][0];
    expect(payload).toMatchObject({
      sub: 'u1',
      email: 'a@b.com',
      roles: [UserRole.USER],
      permissions: ['user-account:read'],
    });
  });

  it('rejects an unknown email', async () => {
    accounts.findByEmail.mockResolvedValue(null);

    await expect(handler.execute(new LoginCommand('x@y.com', 'pw'))).rejects.toBeInstanceOf(
      InvalidCredentialsException,
    );
  });

  it('rejects a wrong password', async () => {
    accounts.findByEmail.mockResolvedValue(activeAccount());
    hasher.compare.mockResolvedValue(false);

    await expect(handler.execute(new LoginCommand('a@b.com', 'wrong'))).rejects.toBeInstanceOf(
      InvalidCredentialsException,
    );
  });
});
