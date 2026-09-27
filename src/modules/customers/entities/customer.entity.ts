import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';

@Entity({ name: 'customers' })
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  @Column({ type: 'varchar', length: 150 })
  fullName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  resetPasswordOtp?: string | null;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  resetPasswordExpires?: Date | null;

  @Column({ type: 'int', default: 0, select: false })
  resetPasswordAttempts?: number;

  @OneToMany(() => Enrollment, (e) => e.customer, { eager: false })
  enrollments!: Enrollment[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
