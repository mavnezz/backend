import { DomainException } from '../../../../../Shared/Domain/DomainException';

export class EmailAlreadyInUseException extends DomainException {
  readonly code = 'EMAIL_ALREADY_IN_USE';
  readonly status = 409;

  constructor(email: string) {
    super(`Email '${email}' is already in use`, { email });
  }
}
