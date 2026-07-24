/** Command: mit E-Mail + Passwort anmelden und ein JWT erhalten. */
export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}
