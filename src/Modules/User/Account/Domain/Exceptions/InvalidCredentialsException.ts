import { DomainException } from '../../../../../Shared/Domain/DomainException';

export class InvalidCredentialsException extends DomainException {
  readonly code = 'INVALID_CREDENTIALS';
  readonly status = 401;

  constructor() {
    super('Invalid email or password');
  }
}
