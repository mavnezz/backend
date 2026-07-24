import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/** Eingehender Request zum Registrieren eines Nutzer-Kontos. */
export class RegisterUserAccountRequest {
  @IsEmail()
  @MaxLength(320)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
