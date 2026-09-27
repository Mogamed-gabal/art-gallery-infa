import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../courses/entities/course.entity';
import { CustomersModule } from '../customers/customers.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { CloudinaryModule } from '../../shared/cloudinary/cloudinary.module';
import { CourseVideosController } from './course-videos.controller';
import { CourseVideosService } from './course-videos.service';
import { CourseVideo } from './entities/course-video.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseVideo, Course]),
    EnrollmentsModule,
    CustomersModule,
    CloudinaryModule,
  ],
  controllers: [CourseVideosController],
  providers: [CourseVideosService],
  exports: [CourseVideosService, TypeOrmModule],
})
export class CourseVideosModule {}
