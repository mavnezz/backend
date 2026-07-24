/**
 * Permission-Konstanten dieses Moduls. Sie werden an den Routen via
 * `@RequirePermission(...)` deklariert. Der Boot-Seeder (s. Shared/Authorization)
 * findet sie automatisch über die Route-Metadaten und schreibt fehlende in die
 * `permissions`-Tabelle nach — kein manueller Seeder/Migration nötig.
 */
export const AccountPermissions = {
  READ: 'user-account:read',
} as const;
