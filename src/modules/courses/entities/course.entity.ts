import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'courses' })
export class Course {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 180 }) title!: string;
  @Column({ type: 'text' }) description!: string;
  @Column({ type: 'varchar', length: 1000 }) externalUrl!: string;
  @Column({ type: 'varchar', length: 1000, nullable: true }) welcomeVideoUrl!: string | null;
  @Column({ default: true }) isActive!: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
