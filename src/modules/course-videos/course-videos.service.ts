import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../courses/entities/course.entity';
import { CreateCourseVideoDto, UpdateCourseVideoDto } from './dto/course-video.dto';
import { CourseVideo } from './entities/course-video.entity';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';

@Injectable()
export class CourseVideosService {
  constructor(
    @InjectRepository(CourseVideo)
    private readonly videoRepo: Repository<CourseVideo>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /** Upload video to Cloudinary */
  async uploadVideo(file: Express.Multer.File) {
    return this.cloudinary.uploadVideo(file);
  }

  /** Returns the welcome video for a course (public endpoint) */
  async getWelcomeVideo(courseId: string): Promise<CourseVideo | null> {
    return this.videoRepo.findOne({
      where: { course: { id: courseId }, isWelcome: true },
    });
  }

  /** Returns all videos for a course (enrolled users only — enforced in controller) */
  async getCourseVideos(courseId: string): Promise<CourseVideo[]> {
    return this.videoRepo.find({
      where: { course: { id: courseId } },
      order: { order: 'ASC' },
    });
  }

  /** Admin: add a video to a course */
  async create(dto: CreateCourseVideoDto, videoFile?: Express.Multer.File): Promise<CourseVideo> {
    const course = await this.courseRepo.findOne({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Course not found');

    let videoUrl = dto.videoUrl;
    let cloudinaryPublicId = dto.cloudinaryPublicId ?? null;

    if (videoFile) {
      const upload = await this.cloudinary.uploadVideo(videoFile);
      videoUrl = upload.secureUrl;
      cloudinaryPublicId = upload.publicId;
    }

    if (!videoUrl) {
      throw new BadRequestException('رابط الفيديو أو ملف الفيديو مطلوب');
    }

    // Ensure at most one welcome video per course
    if (dto.isWelcome) {
      await this.videoRepo.update(
        { course: { id: dto.courseId }, isWelcome: true },
        { isWelcome: false },
      );
      await this.courseRepo.update(dto.courseId, { welcomeVideoUrl: videoUrl });
    }

    const video = this.videoRepo.create({
      course,
      titleAr: dto.titleAr,
      titleEn: dto.titleEn,
      descriptionAr: dto.descriptionAr ?? null,
      descriptionEn: dto.descriptionEn ?? null,
      videoUrl,
      cloudinaryPublicId,
      order: dto.order,
      isWelcome: dto.isWelcome ?? false,
      durationSeconds: dto.durationSeconds ?? null,
    });
    return this.videoRepo.save(video);
  }

  /** Admin: update a video */
  async update(id: string, dto: UpdateCourseVideoDto, videoFile?: Express.Multer.File): Promise<CourseVideo> {
    const video = await this.findOne(id);

    if (videoFile) {
      const upload = await this.cloudinary.uploadVideo(videoFile);
      dto.videoUrl = upload.secureUrl;
      dto.cloudinaryPublicId = upload.publicId;
    }

    if (dto.isWelcome === true) {
      await this.videoRepo.update(
        { course: { id: video.course.id }, isWelcome: true },
        { isWelcome: false },
      );
      const newWelcomeUrl = dto.videoUrl || video.videoUrl;
      await this.courseRepo.update(video.course.id, { welcomeVideoUrl: newWelcomeUrl });
    }

    Object.assign(video, dto);
    return this.videoRepo.save(video);
  }

  /** Admin: delete a video */
  async remove(id: string): Promise<void> {
    const video = await this.findOne(id);
    await this.videoRepo.remove(video);
  }

  private async findOne(id: string): Promise<CourseVideo> {
    const video = await this.videoRepo.findOne({
      where: { id },
      relations: { course: true },
    });
    if (!video) throw new NotFoundException('Course video not found');
    return video;
  }
}
