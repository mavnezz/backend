import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../../Shared/Auth/Decorators/CurrentUser';
import { Public } from '../../../../../Shared/Auth/Decorators/Public';
import { JwtPayload } from '../../../../../Shared/Auth/JwtPayload';
import { LoginCommand } from '../../Application/Command/LoginCommand';
import { LoginResult } from '../../Application/Command/LoginHandler';
import { LoginRequest } from './Requests/LoginRequest';

/** Öffentlicher Login + Auskunft über den aktuell authentifizierten Nutzer. */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginRequest): Promise<LoginResult> {
    return this.commandBus.execute<LoginCommand, LoginResult>(
      new LoginCommand(body.email, body.password),
    );
  }

  /** Nur Authentifizierung nötig (kein Permission-Guard). */
  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: JwtPayload): JwtPayload {
    return user;
  }
}
