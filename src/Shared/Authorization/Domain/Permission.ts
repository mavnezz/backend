import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/** Registry-Eintrag einer im Code deklarierten Permission. */
@Entity({ name: 'permissions' })
export class Permission {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 160 })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
