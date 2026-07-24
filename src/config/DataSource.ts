import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './TypeOrmConfig';

// Für das Migrations-CLI: .env laden und eine DataSource bereitstellen.
dotenv.config();

export default new DataSource(buildDataSourceOptions());
