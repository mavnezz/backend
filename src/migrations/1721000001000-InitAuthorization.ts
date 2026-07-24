import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Autorisierungs-Tabellen: `permissions` (Registry) und `roles` (mit
 * Permission-Namensliste). Befüllt werden sie beim Boot durch den
 * PermissionSynchronizer, nicht durch diese Migration.
 */
export class InitAuthorization1721000001000 implements MigrationInterface {
  name = 'InitAuthorization1721000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const timestampType = isPostgres ? 'TIMESTAMP' : 'DATETIME';
    const nowDefault = isPostgres ? 'now()' : "(datetime('now'))";

    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" varchar(36) NOT NULL,
        "name" varchar(160) NOT NULL,
        "created_at" ${timestampType} NOT NULL DEFAULT ${nowDefault},
        CONSTRAINT "PK_permissions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_permissions_name" ON "permissions" ("name")`,
    );

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" varchar(36) NOT NULL,
        "name" varchar(80) NOT NULL,
        "permissions" text NOT NULL,
        "created_at" ${timestampType} NOT NULL DEFAULT ${nowDefault},
        CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_roles_name" ON "roles" ("name")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_roles_name"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP INDEX "UQ_permissions_name"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
  }
}
