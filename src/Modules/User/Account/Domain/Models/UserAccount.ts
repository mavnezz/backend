import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserAccountStatus } from '../Enums/UserAccountStatus';
import { UserRole } from '../Enums/UserRole';

/**
 * Nutzer-Konto — ORM-Model = Domain-Model (ActiveRecord, `extends BaseEntity`).
 * Bewusster Kompromiss (s. README): die einzige Framework-Kopplung im Domain
 * sind die TypeORM-Decorators. Persistenz läuft trotzdem nur über den Port
 * `UserAccountRepository`.
 */
@Entity({ name: 'user_accounts' })
export class UserAccount extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 320 })
  email: string;

  @Column({ type: 'varchar', name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20 })
  status: UserAccountStatus;

  @Column({ type: 'simple-json' })
  roles: UserRole[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
