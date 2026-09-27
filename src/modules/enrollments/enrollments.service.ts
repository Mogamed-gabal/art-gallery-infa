import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type Configuration } from '../../config/configuration';
import { PayPalService } from '../../shared/paypal/paypal.service';
import { Course } from '../courses/entities/course.entity';
import { Customer } from '../customers/entities/customer.entity';
import {
  AdminGrantEnrollmentDto,
  CaptureEnrollmentDto,
  CreateEnrollmentOrderDto,
} from './dto/enrollment.dto';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly paypalService: PayPalService,
    private readonly configService: ConfigService<Configuration>,
  ) {}

  /** Checks whether a customer is enrolled in a specific course */
  async isEnrolled(customerId: string, courseId: string): Promise<boolean> {
    const count = await this.enrollmentRepo.count({
      where: {
        customer: { id: customerId },
        course: { id: courseId },
        status: EnrollmentStatus.ACTIVE,
      },
    });
    return count > 0;
  }

  /** Throws 403 Forbidden if the customer is not actively enrolled */
  async assertEnrolled(customerId: string, courseId: string): Promise<void> {
    const enrolled = await this.isEnrolled(customerId, courseId);
    if (!enrolled) {
      throw new ForbiddenException(
        'You are not enrolled in this course. Please purchase the course to access lessons.',
      );
    }
  }

  /** Create PayPal order for course enrollment */
  async createPayPalOrder(customerId: string, dto: CreateEnrollmentOrderDto) {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const course = await this.courseRepo.findOne({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const alreadyEnrolled = await this.isEnrolled(customerId, dto.courseId);
    if (alreadyEnrolled) {
      throw new ConflictException('You are already enrolled in this course');
    }

    const priceNum = parseFloat(course.price || '0');
    if (priceNum <= 0) {
      // Free course: direct instant enrollment
      const enrollment = this.enrollmentRepo.create({
        customer,
        course,
        amountPaid: '0.00',
        currency: 'USD',
        status: EnrollmentStatus.ACTIVE,
      });
      await this.enrollmentRepo.save(enrollment);
      return { freeEnrollment: true, enrollment };
    }

    const frontendUrl =
      this.configService.get('app.frontendUrl', { infer: true }) || 'http://localhost:4300';
    const returnUrl = dto.returnUrl || `${frontendUrl}/courses/${course.id}?status=paid`;
    const cancelUrl = dto.cancelUrl || `${frontendUrl}/courses/${course.id}?status=cancelled`;

    const currency = dto.currency || 'USD';
    const orderNumber = `CRSE-${Date.now()}`;

    const orderResult = await this.paypalService.createOrder(
      orderNumber,
      priceNum,
      currency,
      returnUrl,
      cancelUrl,
    );

    return {
      freeEnrollment: false,
      ...orderResult,
    };
  }

  /** Capture PayPal payment and complete enrollment */
  async captureAndEnroll(customerId: string, dto: CaptureEnrollmentDto) {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const course = await this.courseRepo.findOne({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.enrollmentRepo.findOne({
      where: {
        customer: { id: customerId },
        course: { id: dto.courseId },
      },
    });
    if (existing && existing.status === EnrollmentStatus.ACTIVE) {
      return existing;
    }

    // Capture PayPal order
    const capture = await this.paypalService.captureOrder(dto.paypalOrderId);
    if (capture.status !== 'COMPLETED') {
      throw new BadRequestException(`PayPal payment status: ${capture.status}`);
    }

    const enrollment = this.enrollmentRepo.create({
      customer,
      course,
      paypalOrderId: dto.paypalOrderId,
      captureId: capture.captureId,
      amountPaid: course.price,
      currency: 'USD',
      status: EnrollmentStatus.ACTIVE,
    });

    return this.enrollmentRepo.save(enrollment);
  }

  /** Get all courses enrolled by the customer */
  async getMyEnrollments(customerId: string): Promise<Enrollment[]> {
    return this.enrollmentRepo.find({
      where: { customer: { id: customerId }, status: EnrollmentStatus.ACTIVE },
      relations: { course: true },
      order: { createdAt: 'DESC' },
    });
  }

  /** Admin: get total subscribers count for a course */
  async getCourseSubscribersCount(courseId: string): Promise<number> {
    return this.enrollmentRepo.count({
      where: { course: { id: courseId }, status: EnrollmentStatus.ACTIVE },
    });
  }

  /** Admin: get subscriber list for a course */
  async getCourseSubscribers(courseId: string): Promise<Enrollment[]> {
    return this.enrollmentRepo.find({
      where: { course: { id: courseId } },
      relations: { customer: true },
      order: { createdAt: 'DESC' },
    });
  }

  /** Admin: manually grant enrollment to a customer */
  async adminGrantEnrollment(dto: AdminGrantEnrollmentDto): Promise<Enrollment> {
    const customer = await this.customerRepo.findOne({
      where: { email: dto.customerEmail.toLowerCase().trim() },
    });
    if (!customer) throw new NotFoundException('Customer not found with this email');

    const course = await this.courseRepo.findOne({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.enrollmentRepo.findOne({
      where: { customer: { id: customer.id }, course: { id: course.id } },
    });
    if (existing) {
      existing.status = EnrollmentStatus.ACTIVE;
      return this.enrollmentRepo.save(existing);
    }

    const enrollment = this.enrollmentRepo.create({
      customer,
      course,
      amountPaid: '0.00',
      currency: 'USD',
      status: EnrollmentStatus.ACTIVE,
    });
    return this.enrollmentRepo.save(enrollment);
  }
}
