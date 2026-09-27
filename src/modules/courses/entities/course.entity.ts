import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CourseVideo } from '../../course-videos/entities/course-video.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';

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

  /** Price in USD */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price!: string;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => CourseVideo, (v) => v.course, { cascade: true, eager: false })
  videos!: CourseVideo[];

  @OneToMany(() => Enrollment, (e) => e.course, { eager: false })
  enrollments!: Enrollment[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
