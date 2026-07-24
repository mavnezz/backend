import { MigrationInterface, QueryRunner } from 'typeorm';

/** Initiale Migration: Tabelle `user_accounts`. Läuft auf SQLite und Postgres. */
export class InitUserAccounts1721000000000 implements MigrationInterface {
  name = 'InitUserAccounts1721000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const timestampType = isPostgres ? 'TIMESTAMP' : 'DATETIME';
    const nowDefault = isPostgres ? 'now()' : "(datetime('now'))";

    await queryRunner.query(`
      CREATE TABLE "user_accounts" (
        "id" varchar(36) NOT NULL,
        "email" varchar(320) NOT NULL,
        "password_hash" varchar NOT NULL,
        "status" varchar(20) NOT NULL,
        "roles" text NOT NULL,
        "created_at" ${timestampType} NOT NULL DEFAULT ${nowDefault},
        "updated_at" ${timestampType} NOT NULL DEFAULT ${nowDefault},
        CONSTRAINT "PK_user_accounts_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_accounts_email" ON "user_accounts" ("email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_user_accounts_email"`);
    await queryRunner.query(`DROP TABLE "user_accounts"`);
  }
}
