import { Injectable } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../Auth/Decorators/RequirePermission';

/**
 * Findet automatisch alle im Code deklarierten Permissions, indem sie die
 * `@RequirePermission(...)`-Metadaten aller Controller-Routen (und Klassen)
 * einsammelt. Kein manueller Seeder/Migration nötig.
 */
@Injectable()
export class PermissionDiscoveryService {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  discover(): string[] {
    const permissions = new Set<string>();

    for (const wrapper of this.discovery.getControllers()) {
      const instance = wrapper.instance;
      if (!instance) {
        continue;
      }

      // Klassen-Ebene
      this.collect(this.reflector.get<string[]>(PERMISSIONS_KEY, instance.constructor), permissions);

      // Methoden-Ebene (Route-Handler)
      const prototype = Object.getPrototypeOf(instance);
      for (const method of this.scanner.getAllMethodNames(prototype)) {
        this.collect(this.reflector.get<string[]>(PERMISSIONS_KEY, prototype[method]), permissions);
      }
    }

    return [...permissions];
  }

  private collect(permissions: string[] | undefined, into: Set<string>): void {
    for (const permission of permissions ?? []) {
      into.add(permission);
    }
  }
}
