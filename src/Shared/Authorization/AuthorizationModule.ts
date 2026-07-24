import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbPermissionResolver } from './DbPermissionResolver';
import { Permission } from './Domain/Permission';
import { Role } from './Domain/Role';
import { PermissionDiscoveryService } from './PermissionDiscoveryService';
import { PERMISSION_RESOLVER } from './PermissionResolver';
import { PermissionSynchronizer } from './PermissionSynchronizer';

/**
 * Autorisierung: Permission-Discovery (aus Route-Metadaten), Boot-Seeder
 * (schreibt fehlende Permissions nach, Admin bekommt alle) und der
 * DB-gestützte Permission-Resolver für den Login.
 */
@Module({
  imports: [DiscoveryModule, TypeOrmModule.forFeature([Permission, Role])],
  providers: [
    PermissionDiscoveryService,
    PermissionSynchronizer,
    { provide: PERMISSION_RESOLVER, useClass: DbPermissionResolver },
  ],
  exports: [PERMISSION_RESOLVER],
})
export class AuthorizationModule {}
