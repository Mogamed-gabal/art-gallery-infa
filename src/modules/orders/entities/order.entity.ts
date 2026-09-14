import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}
export enum OrderStatus {
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}
export enum PaymentCurrency {
  USD = 'USD',
  EUR = 'EUR',
}

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true, length: 32 }) orderNumber!: string;
  @Column({ length: 180 }) customerName!: string;
  @Column({ length: 40 }) phone!: string;
  @Column({ type: 'varchar', length: 40, nullable: true }) whatsappPhone!:
    string | null;
  @Column({ type: 'varchar', length: 180, nullable: true }) email!:
    string | null;
  @Column({ type: 'text' }) shippingAddress!: string;
  @Column({ type: 'date', nullable: true }) preferredDeliveryDate!:
    string | null;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) totalAmount!: string;
  /** Total amount in the chosen payment currency (USD or EUR) */
  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  totalAmountConverted!: string | null;
  /** Currency selected by the buyer for PayPal payment */
  @Column({
    type: 'enum',
    enum: PaymentCurrency,
    nullable: true,
  })
  paymentCurrency!: PaymentCurrency | null;
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus!: PaymentStatus;
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PROCESSING })
  orderStatus!: OrderStatus;
  /** PayPal Order ID returned when the PayPal order is created */
  @Index()
  @Column({ type: 'varchar', nullable: true })
  paypalOrderId!: string | null;
  /** PayPal Capture ID returned after the buyer approves and payment is captured */
  @Column({ type: 'varchar', nullable: true }) paypalCaptureId!: string | null;
  @Column({ type: 'timestamptz', nullable: true })
  courseEmailSentAt!: Date | null;
  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items!: OrderItem[];
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
