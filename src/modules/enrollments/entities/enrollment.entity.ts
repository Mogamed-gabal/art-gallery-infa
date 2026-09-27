import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { Customer } from '../../customers/entities/customer.entity';

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'enrollments' })
@Index(['customer', 'course'], { unique: true })
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Customer, (c) => c.enrollments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @ManyToOne(() => Course, (c) => c.enrollments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paypalOrderId?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  captureId?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid!: string;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.ACTIVE,
  })
  status!: EnrollmentStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
