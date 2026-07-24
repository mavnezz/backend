import { UserAccount } from '../Models/UserAccount';

/** DI-Token für den Repository-Port (Interfaces existieren zur Laufzeit nicht). */
export const USER_ACCOUNT_REPOSITORY = 'USER_ACCOUNT_REPOSITORY';

/**
 * Port: der einzige Weg zur Persistenz eines Nutzer-Kontos.
 * Implementierungen (Adapter) liegen in `Infrastructure/Database`.
 */
export interface UserAccountRepository {
  findById(id: string): Promise<UserAccount | null>;
  findByEmail(email: string): Promise<UserAccount | null>;
  existsByEmail(email: string): Promise<boolean>;
  save(account: UserAccount): Promise<UserAccount>;
}
