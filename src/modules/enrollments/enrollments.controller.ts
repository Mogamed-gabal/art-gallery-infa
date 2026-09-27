import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerAuthGuard } from '../customers/guards/customer-auth.guard';
import { type CustomerJwtPayload } from '../customers/strategies/customer-jwt.strategy';
import {
  AdminGrantEnrollmentDto,
  CaptureEnrollmentDto,
  CreateEnrollmentOrderDto,
} from './dto/enrollment.dto';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('Enrollments')
@Controller({ path: 'enrollments', version: '1' })
export class EnrollmentsController {
  constructor(private readonly service: EnrollmentsService) {}

  @Post('create-order')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth('customer-token')
  @ApiOperation({ summary: 'Initiate PayPal checkout for course enrollment' })
  createOrder(
    @Request() req: { user: CustomerJwtPayload },
    @Body() dto: CreateEnrollmentOrderDto,
  ) {
    return this.service.createPayPalOrder(req.user.sub, dto);
  }

  @Post('capture')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth('customer-token')
  @ApiOperation({ summary: 'Capture PayPal order and activate course enrollment' })
  capture(
    @Request() req: { user: CustomerJwtPayload },
    @Body() dto: CaptureEnrollmentDto,
  ) {
    return this.service.captureAndEnroll(req.user.sub, dto);
  }

  @Get('my')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth('customer-token')
  @ApiOperation({ summary: 'Get current customer enrolled courses' })
  getMyEnrollments(@Request() req: { user: CustomerJwtPayload }) {
    return this.service.getMyEnrollments(req.user.sub);
  }

  @Get('check/:courseId')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth('customer-token')
  @ApiOperation({ summary: 'Check if current customer is enrolled in a course' })
  async checkEnrollment(
    @Request() req: { user: CustomerJwtPayload },
    @Param('courseId') courseId: string,
  ) {
    const enrolled = await this.service.isEnrolled(req.user.sub, courseId);
    return { enrolled };
  }

  @Get('course/:courseId/subscribers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin: Get subscriber list and count for a course' })
  async getCourseSubscribers(@Param('courseId') courseId: string) {
    const count = await this.service.getCourseSubscribersCount(courseId);
    const subscribers = await this.service.getCourseSubscribers(courseId);
    return { count, subscribers };
  }

  @Post('admin/grant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin: Manually grant course enrollment to an email' })
  adminGrant(@Body() dto: AdminGrantEnrollmentDto) {
    return this.service.adminGrantEnrollment(dto);
  }
}
