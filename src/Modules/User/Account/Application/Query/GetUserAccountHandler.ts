import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserAccountDTO } from '../../Domain/DTOs/UserAccountDTO';
import { UserAccountNotFoundException } from '../../Domain/Exceptions/UserAccountNotFoundException';
import {
  USER_ACCOUNT_REPOSITORY,
  UserAccountRepository,
} from '../../Domain/Ports/UserAccountRepository';
import { GetUserAccountQuery } from './GetUserAccountQuery';

@QueryHandler(GetUserAccountQuery)
export class GetUserAccountHandler implements IQueryHandler<GetUserAccountQuery, UserAccountDTO> {
  constructor(
    @Inject(USER_ACCOUNT_REPOSITORY) private readonly accounts: UserAccountRepository,
  ) {}

  async execute(query: GetUserAccountQuery): Promise<UserAccountDTO> {
    const account = await this.accounts.findById(query.id);
    if (!account) {
      throw new UserAccountNotFoundException(query.id);
    }

    return {
      id: account.id,
      email: account.email,
      status: account.status,
      roles: account.roles,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
