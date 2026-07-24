import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './Guards/JwtAuthGuard';
import { PermissionsGuard } from './Guards/PermissionsGuard';
import { JwtStrategy } from './JwtStrategy';

/**
 * Stellt die stateless JWT-Authentifizierung bereit und registriert die
 * globalen Guards (erst Authentifizierung, dann Autorisierung).
 * Exportiert `JwtModule`, damit Module (z. B. Login) Tokens signieren können.
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '3600s') },
      }),
    }),
  ],
  providers: [
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [JwtModule],
})
export class SharedAuthModule {}
