import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity({ name: 'client_requests' })
export class ClientRequest {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 180, nullable: true }) name?: string;
  @Column({ length: 180, nullable: true }) email?: string;
  @Column({ length: 40 }) phone!: string;
  @Column({ length: 40 }) whatsapp!: string;
  @Column({ type: 'text' }) description!: string;
  @Column({ type: 'jsonb' }) images!: { url: string; publicId: string }[];
  @Column({ default: 'NEW' }) status!: 'NEW' | 'CONTACTED' | 'CLOSED';
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
}
