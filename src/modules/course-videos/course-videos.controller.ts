import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerAuthGuard } from '../customers/guards/customer-auth.guard';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CreateCourseVideoDto, UpdateCourseVideoDto } from './dto/course-video.dto';
import { CourseVideosService } from './course-videos.service';

@ApiTags('Course Videos')
@Controller({ path: 'course-videos', version: '1' })
export class CourseVideosController {
  constructor(
    private readonly service: CourseVideosService,
    private readonly enrollments: EnrollmentsService,
  ) {}

  /** Public: get the welcome/preview video for a course */
  @Get(':courseId/welcome')
  @ApiOperation({ summary: 'Get the free welcome video for a course' })
  getWelcome(@Param('courseId') courseId: string) {
    return this.service.getWelcomeVideo(courseId);
  }

  /** Enrolled students only: get all lesson videos */
  @Get(':courseId/lessons')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth('customer-token')
  @ApiOperation({ summary: 'Get all lesson videos (enrolled students only)' })
  async getLessons(
    @Param('courseId') courseId: string,
    @Request() req: { user: { sub: string } },
  ) {
    await this.enrollments.assertEnrolled(req.user.sub, courseId);
    return this.service.getCourseVideos(courseId);
  }

  /** Admin: get all videos for a course */
  @Get(':courseId/admin-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin: Get all videos for a course' })
  getAdminVideos(@Param('courseId') courseId: string) {
    return this.service.getCourseVideos(courseId);
  }

  /** Admin: upload a video file directly to Cloudinary */
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('video', {
      storage: memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Upload a video file to Cloudinary' })
  async uploadVideo(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('ملف الفيديو مطلوب');
    }
    const upload = await this.service.uploadVideo(file);
    return {
      videoUrl: upload.secureUrl,
      cloudinaryPublicId: upload.publicId,
    };
  }

  /** Admin: create a video for a course (supports JSON or multipart with video file) */
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('video', {
      storage: memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data', 'application/json')
  create(
    @Body() dto: CreateCourseVideoDto,
    @UploadedFile() videoFile?: Express.Multer.File,
  ) {
    return this.service.create(dto, videoFile);
  }

  /** Admin: update a video (supports JSON or multipart with video file) */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('video', {
      storage: memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data', 'application/json')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseVideoDto,
    @UploadedFile() videoFile?: Express.Multer.File,
  ) {
    return this.service.update(id, dto, videoFile);
  }

  /** Admin: delete a video */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
