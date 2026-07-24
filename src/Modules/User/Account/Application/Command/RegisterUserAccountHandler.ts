import { randomUUID } from 'crypto';
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UserAccountStatus } from '../../Domain/Enums/UserAccountStatus';
import { EmailAlreadyInUseException } from '../../Domain/Exceptions/EmailAlreadyInUseException';
import { UserAccount } from '../../Domain/Models/UserAccount';
import { PASSWORD_HASHER, PasswordHasher } from '../../Domain/Ports/PasswordHasher';
import {
  USER_ACCOUNT_REPOSITORY,
  UserAccountRepository,
} from '../../Domain/Ports/UserAccountRepository';
import { UserAccountPolicy } from '../../Domain/Service/UserAccountPolicy';
import { UserAccountRegistered } from '../Event/UserAccountRegistered';
import { RegisterUserAccountCommand } from './RegisterUserAccountCommand';

@CommandHandler(RegisterUserAccountCommand)
export class RegisterUserAccountHandler
  implements ICommandHandler<RegisterUserAccountCommand, string>
{
  constructor(
    @Inject(USER_ACCOUNT_REPOSITORY) private readonly accounts: UserAccountRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly policy: UserAccountPolicy,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserAccountCommand): Promise<string> {
    const email = this.policy.normalizeEmail(command.email);

    if (await this.accounts.existsByEmail(email)) {
      throw new EmailAlreadyInUseException(email);
    }

    const account = new UserAccount();
    account.id = randomUUID();
    account.email = email;
    account.passwordHash = await this.hasher.hash(command.password);
    account.status = UserAccountStatus.ACTIVE;
    account.roles = this.policy.defaultRolesForRegistration();

    const saved = await this.accounts.save(account);
    this.eventBus.publish(new UserAccountRegistered(saved.id, saved.email));

    return saved.id;
  }
}
