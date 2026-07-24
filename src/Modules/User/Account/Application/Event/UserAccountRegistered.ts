import { IEvent } from '@nestjs/cqrs';

/** Domain-Event: ein Nutzer-Konto wurde registriert. */
export class UserAccountRegistered implements IEvent {
  constructor(
    public readonly accountId: string,
    public readonly email: string,
  ) {}
}
