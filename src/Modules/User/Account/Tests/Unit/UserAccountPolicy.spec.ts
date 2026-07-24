import { UserAccountStatus } from '../../Domain/Enums/UserAccountStatus';
import { UserRole } from '../../Domain/Enums/UserRole';
import { UserAccount } from '../../Domain/Models/UserAccount';
import { UserAccountPolicy } from '../../Domain/Service/UserAccountPolicy';

describe('UserAccountPolicy', () => {
  const policy = new UserAccountPolicy();

  it('assigns the USER role by default on registration', () => {
    expect(policy.defaultRolesForRegistration()).toEqual([UserRole.USER]);
  });

  it('normalizes emails (trim + lowercase)', () => {
    expect(policy.normalizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com');
  });

  it('allows only active accounts to authenticate', () => {
    const account = new UserAccount();

    account.status = UserAccountStatus.ACTIVE;
    expect(policy.canAuthenticate(account)).toBe(true);

    account.status = UserAccountStatus.SUSPENDED;
    expect(policy.canAuthenticate(account)).toBe(false);
  });
});
