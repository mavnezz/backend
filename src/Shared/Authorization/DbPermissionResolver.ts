import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './Domain/Role';
import { PermissionResolver } from './PermissionResolver';

/** Adapter: löst Permissions einer Rollenmenge aus der DB auf. */
@Injectable()
export class DbPermissionResolver implements PermissionResolver {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
  ) {}

  async resolveForRoles(roleNames: string[]): Promise<string[]> {
    if (roleNames.length === 0) {
      return [];
    }
    const roles = await this.roles.find({ where: { name: In(roleNames) } });
    const permissions = new Set<string>();
    for (const role of roles) {
      for (const permission of role.permissions) {
        permissions.add(permission);
      }
    }
    return [...permissions];
  }
}
