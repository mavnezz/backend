import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccount } from '../../Domain/Models/UserAccount';
import { UserAccountRepository } from '../../Domain/Ports/UserAccountRepository';

/** Adapter: implementiert den Repository-Port mit TypeORM. */
@Injectable()
export class TypeOrmUserAccountRepository implements UserAccountRepository {
  constructor(
    @InjectRepository(UserAccount)
    private readonly repository: Repository<UserAccount>,
  ) {}

  findById(id: string): Promise<UserAccount | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<UserAccount | null> {
    return this.repository.findOne({ where: { email } });
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await this.repository.count({ where: { email } })) > 0;
  }

  save(account: UserAccount): Promise<UserAccount> {
    return this.repository.save(account);
  }
}
