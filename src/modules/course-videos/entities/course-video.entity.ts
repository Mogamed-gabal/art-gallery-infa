import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';

@Entity({ name: 'course_videos' })
export class CourseVideo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Course, (course) => course.videos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @Column({ type: 'varchar', length: 180 })
  titleAr!: string;

  @Column({ type: 'varchar', length: 180 })
  titleEn!: string;

  @Column({ type: 'text', nullable: true })
  descriptionAr?: string | null;

  @Column({ type: 'text', nullable: true })
  descriptionEn?: string | null;

  /** Cloudinary secure URL */
  @Column({ type: 'varchar', length: 2000 })
  videoUrl!: string;

  /** Cloudinary public_id for management */
  @Column({ type: 'varchar', length: 500, nullable: true })
  cloudinaryPublicId?: string | null;

  /** 1-based display order */
  @Column({ type: 'int', default: 1 })
  order!: number;

  /** The free welcome/preview video visible without enrollment */
  @Column({ type: 'boolean', default: false })
  isWelcome!: boolean;

  /** Optional duration in seconds for display */
  @Column({ type: 'int', nullable: true })
  durationSeconds?: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
