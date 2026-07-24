/** Command: neues Nutzer-Konto registrieren. */
export class RegisterUserAccountCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}
