import { GetUserAccountHandler } from '../../Application/Query/GetUserAccountHandler';
import { GetUserAccountQuery } from '../../Application/Query/GetUserAccountQuery';
import { UserAccountStatus } from '../../Domain/Enums/UserAccountStatus';
import { UserRole } from '../../Domain/Enums/UserRole';
import { UserAccountNotFoundException } from '../../Domain/Exceptions/UserAccountNotFoundException';
import { UserAccount } from '../../Domain/Models/UserAccount';
import { UserAccountRepository } from '../../Domain/Ports/UserAccountRepository';

describe('GetUserAccountHandler', () => {
  let accounts: jest.Mocked<UserAccountRepository>;
  let handler: GetUserAccountHandler;

  beforeEach(() => {
    accounts = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserAccountRepository>;
    handler = new GetUserAccountHandler(accounts);
  });

  it('maps an account to a DTO without the password hash', async () => {
    const account = Object.assign(new UserAccount(), {
      id: 'id-1',
      email: 'a@b.com',
      passwordHash: 'secret',
      status: UserAccountStatus.ACTIVE,
      roles: [UserRole.USER],
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date('2020-01-02'),
    });
    accounts.findById.mockResolvedValue(account);

    const dto = await handler.execute(new GetUserAccountQuery('id-1'));

    expect(dto).toMatchObject({
      id: 'id-1',
      email: 'a@b.com',
      status: UserAccountStatus.ACTIVE,
      roles: [UserRole.USER],
    });
    expect((dto as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('throws when the account does not exist', async () => {
    accounts.findById.mockResolvedValue(null);

    await expect(handler.execute(new GetUserAccountQuery('missing'))).rejects.toBeInstanceOf(
      UserAccountNotFoundException,
    );
  });
});
