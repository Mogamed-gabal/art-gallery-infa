import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayPalModule } from '../../shared/paypal/paypal.module';
import { Course } from '../courses/entities/course.entity';
import { CustomersModule } from '../customers/customers.module';
import { Customer } from '../customers/entities/customer.entity';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { Enrollment } from './entities/enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment, Course, Customer]),
    PayPalModule,
    CustomersModule,
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService, TypeOrmModule],
})
export class EnrollmentsModule {}
