import { Global, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { GlobalExceptionFilter } from './Http/Filters/GlobalExceptionFilter';
import { SharedAuthModule } from './Auth/SharedAuthModule';
import { AuthorizationModule } from './Authorization/AuthorizationModule';

/**
 * Geteilter Kern (Querschnitt): globale Validierung, einheitliches Fehler-Format,
 * die JWT-Authentifizierung sowie die Autorisierung (Permission-Discovery/-Seeder
 * und -Resolver). `@Global`, damit JwtService, Resolver & Co. modulweit verfügbar
 * sind, ohne überall importiert zu werden.
 */
@Global()
@Module({
  imports: [SharedAuthModule, AuthorizationModule],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
  exports: [SharedAuthModule, AuthorizationModule],
})
export class SharedModule {}
