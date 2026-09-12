import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { Course } from './entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private readonly courseRepository: Repository<Course>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  findActive(): Promise<Course[]> {
    return this.courseRepository.find({ where: { isActive: true }, order: { createdAt: 'DESC' } });
  }

  findAllAdmin(): Promise<Course[]> {
    return this.courseRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, activeOnly = false): Promise<Course> {
    const course = await this.courseRepository.findOne({ where: activeOnly ? { id, isActive: true } : { id } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async create(dto: CreateCourseDto, videoFile?: Express.Multer.File): Promise<Course> {
    let welcomeVideoUrl = dto.welcomeVideoUrl ?? null;
    if (videoFile) {
      const upload = await this.cloudinary.uploadVideo(videoFile);
      welcomeVideoUrl = upload.secureUrl;
    }
    return this.courseRepository.save(
      this.courseRepository.create({
        ...dto,
        welcomeVideoUrl,
        isActive: dto.isActive ?? true,
      }),
    );
  }

  async update(id: string, dto: UpdateCourseDto, videoFile?: Express.Multer.File): Promise<Course> {
    const course = await this.findOne(id);
    Object.assign(course, dto);
    if (videoFile) {
      const upload = await this.cloudinary.uploadVideo(videoFile);
      course.welcomeVideoUrl = upload.secureUrl;
    }
    return this.courseRepository.save(course);
  }

  async remove(id: string): Promise<void> {
    await this.courseRepository.remove(await this.findOne(id));
  }
}
