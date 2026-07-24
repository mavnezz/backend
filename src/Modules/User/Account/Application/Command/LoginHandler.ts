import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../../../../../Shared/Auth/JwtPayload';
import {
  PERMISSION_RESOLVER,
  PermissionResolver,
} from '../../../../../Shared/Authorization/PermissionResolver';
import { InvalidCredentialsException } from '../../Domain/Exceptions/InvalidCredentialsException';
import { PASSWORD_HASHER, PasswordHasher } from '../../Domain/Ports/PasswordHasher';
import {
  USER_ACCOUNT_REPOSITORY,
  UserAccountRepository,
} from '../../Domain/Ports/UserAccountRepository';
import { UserAccountPolicy } from '../../Domain/Service/UserAccountPolicy';
import { LoginCommand } from './LoginCommand';

export interface LoginResult {
  accessToken: string;
}

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, LoginResult> {
  constructor(
    @Inject(USER_ACCOUNT_REPOSITORY) private readonly accounts: UserAccountRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly policy: UserAccountPolicy,
    private readonly jwt: JwtService,
    @Inject(PERMISSION_RESOLVER) private readonly permissionResolver: PermissionResolver,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const email = this.policy.normalizeEmail(command.email);
    const account = await this.accounts.findByEmail(email);

    if (!account || !this.policy.canAuthenticate(account)) {
      throw new InvalidCredentialsException();
    }

    const passwordMatches = await this.hasher.compare(command.password, account.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

    // Permissions werden aus den Rollen aufgelöst und in das (stateless) JWT
    // aufgenommen — Momentaufnahme zum Login-Zeitpunkt.
    const permissions = await this.permissionResolver.resolveForRoles(account.roles);
    const payload: JwtPayload = {
      sub: account.id,
      email: account.email,
      roles: account.roles,
      permissions,
    };

    return { accessToken: await this.jwt.signAsync(payload) };
  }
}
