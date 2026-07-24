import { UserAccountStatus } from '../Enums/UserAccountStatus';
import { UserRole } from '../Enums/UserRole';

/** Read-Model eines Nutzer-Kontos (ohne sensible Felder wie Passwort-Hash). */
export interface UserAccountDTO {
  id: string;
  email: string;
  status: UserAccountStatus;
  roles: UserRole[];
  createdAt: Date;
  updatedAt: Date;
}
