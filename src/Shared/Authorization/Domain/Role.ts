import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/** Rolle mit der Menge ihrer Permissions (als Namensliste). */
@Entity({ name: 'roles' })
export class Role {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ type: 'simple-json' })
  permissions: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
