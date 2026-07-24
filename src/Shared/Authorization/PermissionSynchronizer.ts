import { randomUUID } from 'crypto';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './Domain/Permission';
import { Role } from './Domain/Role';
import { PermissionDiscoveryService } from './PermissionDiscoveryService';
import { ADMIN_ROLE } from './Roles';

/**
 * Läuft beim Boot: findet alle im Code deklarierten Permissions, schreibt
 * fehlende in die `permissions`-Tabelle nach und ordnet der `admin`-Rolle
 * automatisch alle Permissions zu. Idempotent — sicher bei jedem (Deploy-)Boot.
 */
@Injectable()
export class PermissionSynchronizer implements OnApplicationBootstrap {
  private readonly logger = new Logger(PermissionSynchronizer.name);

  constructor(
    private readonly discovery: PermissionDiscoveryService,
    @InjectRepository(Permission) private readonly permissions: Repository<Permission>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const discovered = this.discovery.discover();
    const added = await this.upsertPermissions(discovered);
    await this.syncAdminRole();
    this.logger.log(
      `Permissions synchronized: ${discovered.length} declared in code, ${added} newly seeded.`,
    );
  }

  private async upsertPermissions(names: string[]): Promise<number> {
    let added = 0;
    for (const name of names) {
      const exists = (await this.permissions.count({ where: { name } })) > 0;
      if (!exists) {
        await this.permissions.save(this.permissions.create({ id: randomUUID(), name }));
        added += 1;
      }
    }
    return added;
  }

  private async syncAdminRole(): Promise<void> {
    const allPermissions = (await this.permissions.find()).map((permission) => permission.name);
    const existing = await this.roles.findOne({ where: { name: ADMIN_ROLE } });
    const admin =
      existing ?? this.roles.create({ id: randomUUID(), name: ADMIN_ROLE, permissions: [] });
    admin.permissions = allPermissions;
    await this.roles.save(admin);
  }
}
