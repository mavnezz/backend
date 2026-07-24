import { DomainException } from '../../../../../Shared/Domain/DomainException';

export class UserAccountNotFoundException extends DomainException {
  readonly code = 'USER_ACCOUNT_NOT_FOUND';
  readonly status = 404;

  constructor(id: string) {
    super(`User account '${id}' not found`, { id });
  }
}
