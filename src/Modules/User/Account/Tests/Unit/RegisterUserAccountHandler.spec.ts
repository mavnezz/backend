import { EventBus } from '@nestjs/cqrs';
import { RegisterUserAccountCommand } from '../../Application/Command/RegisterUserAccountCommand';
import { RegisterUserAccountHandler } from '../../Application/Command/RegisterUserAccountHandler';
import { UserAccountStatus } from '../../Domain/Enums/UserAccountStatus';
import { UserRole } from '../../Domain/Enums/UserRole';
import { EmailAlreadyInUseException } from '../../Domain/Exceptions/EmailAlreadyInUseException';
import { PasswordHasher } from '../../Domain/Ports/PasswordHasher';
import { UserAccountRepository } from '../../Domain/Ports/UserAccountRepository';
import { UserAccountPolicy } from '../../Domain/Service/UserAccountPolicy';

describe('RegisterUserAccountHandler', () => {
  let accounts: jest.Mocked<UserAccountRepository>;
  let hasher: jest.Mocked<PasswordHasher>;
  let eventBus: { publish: jest.Mock };
  let handler: RegisterUserAccountHandler;

  beforeEach(() => {
    accounts = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserAccountRepository>;
    hasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    } as unknown as jest.Mocked<PasswordHasher>;
    eventBus = { publish: jest.fn() };
    handler = new RegisterUserAccountHandler(
      accounts,
      hasher,
      new UserAccountPolicy(),
      eventBus as unknown as EventBus,
    );
  });

  it('registers a new account, hashes the password and publishes an event', async () => {
    accounts.existsByEmail.mockResolvedValue(false);
    hasher.hash.mockResolvedValue('hashed-pw');
    accounts.save.mockImplementation(async (account) => account);

    const id = await handler.execute(
      new RegisterUserAccountCommand('  New@User.com ', 'password123'),
    );

    expect(typeof id).toBe('string');
    expect(accounts.save).toHaveBeenCalledTimes(1);
    const saved = accounts.save.mock.calls[0][0];
    expect(saved.email).toBe('new@user.com');
    expect(saved.passwordHash).toBe('hashed-pw');
    expect(saved.status).toBe(UserAccountStatus.ACTIVE);
    expect(saved.roles).toEqual([UserRole.USER]);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('rejects a duplicate email', async () => {
    accounts.existsByEmail.mockResolvedValue(true);

    await expect(
      handler.execute(new RegisterUserAccountCommand('dup@user.com', 'password123')),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseException);
    expect(accounts.save).not.toHaveBeenCalled();
  });
});
