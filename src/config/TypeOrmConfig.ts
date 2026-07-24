import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { UserAccount } from '../Modules/User/Account/Domain/Models/UserAccount';
import { Permission } from '../Shared/Authorization/Domain/Permission';
import { Role } from '../Shared/Authorization/Domain/Role';

/**
 * Baut die TypeORM-Optionen aus den Umgebungsvariablen.
 * Dev = better-sqlite3 (Zero-Config), Prod = PostgreSQL — per `DB_TYPE`
 * umschaltbar. Wird sowohl von der App (forRootAsync) als auch vom
 * Migrations-CLI (DataSource.ts) genutzt.
 */
export function buildDataSourceOptions(): DataSourceOptions {
  const type = (process.env.DB_TYPE ?? 'better-sqlite3') as 'better-sqlite3' | 'postgres';

  const shared = {
    entities: [UserAccount, Permission, Role],
    migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
    synchronize: false,
    migrationsRun: false,
  };

  if (type === 'postgres') {
    return {
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_DATABASE ?? 'backend',
      ...shared,
    };
  }

  return {
    type: 'better-sqlite3',
    database: process.env.DB_DATABASE ?? 'dev.sqlite',
    ...shared,
  };
}
