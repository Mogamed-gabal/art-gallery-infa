import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { Course } from './entities/course.entity';
import { CourseVideo } from '../course-videos/entities/course-video.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private readonly courseRepository: Repository<Course>,
    @InjectRepository(CourseVideo) private readonly videoRepo: Repository<CourseVideo>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  findActive(): Promise<Course[]> {
    return this.courseRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllAdmin(): Promise<any[]> {
    const courses = await this.courseRepository.find({
      relations: { enrollments: true, videos: true },
      order: { createdAt: 'DESC', videos: { order: 'ASC' } },
    });
    return courses.map((course) => ({
      ...course,
      enrollmentsCount: course.enrollments?.length ?? 0,
      videosCount: course.videos?.length ?? 0,
    }));
  }

  async findOne(id: string, activeOnly = false): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: activeOnly ? { id, isActive: true } : { id },
      relations: { videos: true },
      order: { videos: { order: 'ASC' } },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async create(dto: CreateCourseDto, videoFile?: Express.Multer.File): Promise<Course> {
    let welcomeVideoUrl = dto.welcomeVideoUrl ?? null;
    if (videoFile) {
      const upload = await this.cloudinary.uploadVideo(videoFile);
      welcomeVideoUrl = upload.secureUrl;
    }

    // If welcome video is provided in nested videos, sync welcomeVideoUrl
    if (!welcomeVideoUrl && dto.videos && dto.videos.length > 0) {
      const welcomeVideo = dto.videos.find((v) => v.isWelcome && v.videoUrl);
      if (welcomeVideo?.videoUrl) {
        welcomeVideoUrl = welcomeVideo.videoUrl;
      }
    }

    const title = dto.title || dto.titleAr || dto.titleEn || '';
    const description = dto.description || dto.descriptionAr || dto.descriptionEn || '';
    const price = dto.price !== undefined ? String(dto.price) : '0';

    const course = await this.courseRepository.save(
      this.courseRepository.create({
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
        title,
        description,
        externalUrl: dto.externalUrl || 'https://courses.anasya3qub.com',
        welcomeVideoUrl,
        price,
        isActive: dto.isActive ?? true,
      }),
    );

    // Save nested course videos if provided
    if (dto.videos && dto.videos.length > 0) {
      const videoEntities = dto.videos
        .filter((v) => v.videoUrl && (v.titleAr || v.titleEn))
        .map((v, index) =>
          this.videoRepo.create({
            course,
            titleAr: v.titleAr || v.titleEn || `الدرس ${index + 1}`,
            titleEn: v.titleEn || v.titleAr || `Lesson ${index + 1}`,
            descriptionAr: v.descriptionAr ?? null,
            descriptionEn: v.descriptionEn ?? null,
            videoUrl: v.videoUrl!,
            order: v.order ?? index + 1,
            isWelcome: v.isWelcome ?? false,
            durationSeconds: v.durationSeconds ?? null,
          }),
        );
      if (videoEntities.length > 0) {
        await this.videoRepo.save(videoEntities);
      }
    }

    return this.findOne(course.id);
  }

  async update(id: string, dto: UpdateCourseDto, videoFile?: Express.Multer.File): Promise<Course> {
    const course = await this.findOne(id);
    Object.assign(course, dto);
    if (dto.price !== undefined) {
      course.price = String(dto.price);
    }
    if (dto.titleAr || dto.titleEn) {
      course.title = dto.title || dto.titleAr || dto.titleEn || course.title;
    }
    if (dto.descriptionAr || dto.descriptionEn) {
      course.description = dto.description || dto.descriptionAr || dto.descriptionEn || course.description;
    }
    if (videoFile) {
      const upload = await this.cloudinary.uploadVideo(videoFile);
      course.welcomeVideoUrl = upload.secureUrl;
    }

    if (dto.welcomeVideoUrl !== undefined) {
      course.welcomeVideoUrl = dto.welcomeVideoUrl ?? null;
    }

    // Save or update videos if provided
    if (dto.videos && dto.videos.length > 0) {
      for (const v of dto.videos) {
        if (v.videoUrl && (v.titleAr || v.titleEn)) {
          if (v.isWelcome) {
            await this.videoRepo.update(
              { course: { id: course.id }, isWelcome: true },
              { isWelcome: false },
            );
            course.welcomeVideoUrl = v.videoUrl;
          }
          const videoEntity = this.videoRepo.create({
            course,
            titleAr: v.titleAr || v.titleEn || 'درس جديد',
            titleEn: v.titleEn || v.titleAr || 'New Lesson',
            descriptionAr: v.descriptionAr ?? null,
            descriptionEn: v.descriptionEn ?? null,
            videoUrl: v.videoUrl,
            order: v.order ?? (course.videos?.length ? course.videos.length + 1 : 1),
            isWelcome: v.isWelcome ?? false,
            durationSeconds: v.durationSeconds ?? null,
          });
          await this.videoRepo.save(videoEntity);
        }
      }
    }

    await this.courseRepository.save(course);
    return this.findOne(course.id);
  }

  async remove(id: string): Promise<void> {
    await this.courseRepository.remove(await this.findOne(id));
  }
}
