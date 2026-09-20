import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'courses' })
export class Course {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  titleAr?: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  titleEn?: string | null;

  @Column({ type: 'text', nullable: true })
  descriptionAr?: string | null;

  @Column({ type: 'text', nullable: true })
  descriptionEn?: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  title?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 1000 })
  externalUrl!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  welcomeVideoUrl!: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

