/** DI-Token für den Permission-Resolver. */
export const PERMISSION_RESOLVER = 'PERMISSION_RESOLVER';

/** Port: löst eine Rollenmenge in die Vereinigung ihrer Permissions auf. */
export interface PermissionResolver {
  resolveForRoles(roleNames: string[]): Promise<string[]>;
}
