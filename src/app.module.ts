import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './config/TypeOrmConfig';
import { UserAccountModule } from './Modules/User/Account/UserAccountModule';
import { SharedModule } from './Shared/SharedModule';

/** Root-Modul: bindet Config, Datenbank, den geteilten Kern und die Fachmodule. */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: () => buildDataSourceOptions() }),
    SharedModule,
    UserAccountModule,
  ],
})
export class AppModule {}
