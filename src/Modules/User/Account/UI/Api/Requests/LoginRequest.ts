import { IsEmail, IsString } from 'class-validator';

/** Eingehender Login-Request. */
export class LoginRequest {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
