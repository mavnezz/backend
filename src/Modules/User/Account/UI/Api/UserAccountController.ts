import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../../Shared/Auth/Decorators/Public';
import { RequirePermission } from '../../../../../Shared/Auth/Decorators/RequirePermission';
import { AccountPermissions } from '../../AccountPermissions';
import { RegisterUserAccountCommand } from '../../Application/Command/RegisterUserAccountCommand';
import { GetUserAccountQuery } from '../../Application/Query/GetUserAccountQuery';
import { UserAccountDTO } from '../../Domain/DTOs/UserAccountDTO';
import { RegisterUserAccountRequest } from './Requests/RegisterUserAccountRequest';
import { UserAccountResponse } from './Transformers/UserAccountResponse';

/** HTTP-Einstieg für Nutzer-Konten (nur HTTP-Belange). */
@ApiTags('Accounts')
@Controller('accounts')
export class UserAccountController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** Öffentlich: Selbst-Registrierung eines neuen Kontos. */
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterUserAccountRequest): Promise<{ id: string }> {
    const id = await this.commandBus.execute<RegisterUserAccountCommand, string>(
      new RegisterUserAccountCommand(body.email, body.password),
    );
    return { id };
  }

  /** Geschützt: erfordert Permission `user-account:read`. */
  @ApiBearerAuth()
  @RequirePermission(AccountPermissions.READ)
  @Get(':id')
  async getById(@Param('id') id: string): Promise<UserAccountResponse> {
    const dto = await this.queryBus.execute<GetUserAccountQuery, UserAccountDTO>(
      new GetUserAccountQuery(id),
    );
    return UserAccountResponse.fromDTO(dto);
  }
}
