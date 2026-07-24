import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginHandler } from './Application/Command/LoginHandler';
import { RegisterUserAccountHandler } from './Application/Command/RegisterUserAccountHandler';
import { GetUserAccountHandler } from './Application/Query/GetUserAccountHandler';
import { UserAccount } from './Domain/Models/UserAccount';
import { PASSWORD_HASHER } from './Domain/Ports/PasswordHasher';
import { USER_ACCOUNT_REPOSITORY } from './Domain/Ports/UserAccountRepository';
import { UserAccountPolicy } from './Domain/Service/UserAccountPolicy';
import { AdminAccountSeeder } from './Infrastructure/AdminAccountSeeder';
import { TypeOrmUserAccountRepository } from './Infrastructure/Database/TypeOrmUserAccountRepository';
import { BcryptPasswordHasher } from './Infrastructure/Security/BcryptPasswordHasher';
import { AuthController } from './UI/Api/AuthController';
import { UserAccountController } from './UI/Api/UserAccountController';

const CommandHandlers = [RegisterUserAccountHandler, LoginHandler];
const QueryHandlers = [GetUserAccountHandler];

/**
 * Modul-Verdrahtung ("ServiceProvider"): bindet Ports an Adapter, registriert
 * CQRS-Handler, Controller und das ORM-Feature.
 */
@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([UserAccount])],
  controllers: [UserAccountController, AuthController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    { provide: UserAccountPolicy, useFactory: () => new UserAccountPolicy() },
    { provide: USER_ACCOUNT_REPOSITORY, useClass: TypeOrmUserAccountRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    AdminAccountSeeder,
  ],
})
export class UserAccountModule {}
