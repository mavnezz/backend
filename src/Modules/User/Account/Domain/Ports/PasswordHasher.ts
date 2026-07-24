/** DI-Token für den Passwort-Hasher-Port. */
export const PASSWORD_HASHER = 'PASSWORD_HASHER';

/**
 * Port: Passwörter hashen/prüfen. Konkrete Implementierung (z. B. bcrypt)
 * liegt als Adapter in `Infrastructure/Security`.
 */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
