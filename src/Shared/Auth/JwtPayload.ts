/** Inhalt des JWT (stateless) — trägt Identität, Rollen und aufgelöste Permissions. */
export interface JwtPayload {
  /** User-Account-Id */
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
}
