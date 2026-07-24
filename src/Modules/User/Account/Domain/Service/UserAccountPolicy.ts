import { UserAccountStatus } from '../Enums/UserAccountStatus';
import { UserRole } from '../Enums/UserRole';
import { UserAccount } from '../Models/UserAccount';

/**
 * Reiner Domänen-Service: bündelt fachliche Regeln rund um das Nutzer-Konto,
 * framework-frei und ohne Infrastruktur.
 */
export class UserAccountPolicy {
  /** Rollen, die ein frisch registriertes Konto standardmäßig erhält. */
  defaultRolesForRegistration(): UserRole[] {
    return [UserRole.USER];
  }

  /** Nur aktive Konten dürfen sich authentifizieren. */
  canAuthenticate(account: UserAccount): boolean {
    return account.status === UserAccountStatus.ACTIVE;
  }

  /** E-Mails werden normalisiert (klein, ohne Rand-Whitespace) gespeichert. */
  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
