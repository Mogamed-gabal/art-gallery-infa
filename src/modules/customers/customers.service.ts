import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { MailService } from '../../shared/mail/mail.service';
import {
  LoginCustomerDto,
  RegisterCustomerDto,
  GoogleCustomerLoginDto,
  ForgotPasswordDto,
  VerifyResetOtpDto,
  ResetPasswordDto,
} from './dto/customer-auth.dto';
import { Customer } from './entities/customer.entity';
import { type CustomerJwtPayload } from './strategies/customer-jwt.strategy';

const BCRYPT_ROUNDS = 12;

export interface CustomerAuthResponse {
  readonly access_token: string;
  readonly customer: Omit<Customer, 'password' | 'enrollments'>;
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterCustomerDto): Promise<CustomerAuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const existing = await this.customerRepo.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const customer = await this.customerRepo.save(
      this.customerRepo.create({ email, password: hashed, fullName: dto.fullName }),
    );

    return { access_token: this.signToken(customer), customer };
  }

  async login(dto: LoginCustomerDto): Promise<CustomerAuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const customer = await this.customerRepo
      .createQueryBuilder('c')
      .addSelect('c.password')
      .where('c.email = :email', { email })
      .getOne();

    if (!customer || !(await bcrypt.compare(dto.password, customer.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return { access_token: this.signToken(customer), customer };
  }

  async googleLogin(dto: GoogleCustomerLoginDto): Promise<CustomerAuthResponse> {
    let email = dto.email;
    let fullName = dto.fullName;

    if (dto.idToken) {
      try {
        const parts = dto.idToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          if (payload?.email) {
            email = payload.email;
          }
          if (payload?.name && !fullName) {
            fullName = payload.name;
          }
        }
      } catch {
        // Fallback to dto values
      }
    }

    email = this.normalizeEmail(email);
    let customer = await this.customerRepo.findOne({ where: { email } });

    if (!customer) {
      const generatedPassword = await bcrypt.hash(
        `GOOGLE_AUTH_${dto.googleId || Date.now()}_${Math.random()}`,
        BCRYPT_ROUNDS,
      );
      customer = await this.customerRepo.save(
        this.customerRepo.create({
          email,
          fullName: fullName || email.split('@')[0],
          password: generatedPassword,
        }),
      );
    }

    return { access_token: this.signToken(customer), customer };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
    const email = this.normalizeEmail(dto.email);
    const customer = await this.customerRepo
      .createQueryBuilder('c')
      .addSelect(['c.resetPasswordExpires', 'c.resetPasswordAttempts'])
      .where('c.email = :email', { email })
      .getOne();

    if (!customer) {
      return {
        success: true,
        message: 'إذا كان البريد مسجلاً في الأكاديمية، فسيصلك رمز التحقق خلال لحظات.',
      };
    }

    if (customer.resetPasswordExpires) {
      const remainingMs = customer.resetPasswordExpires.getTime() - Date.now();
      if (remainingMs > 14 * 60 * 1000) {
        throw new BadRequestException('يرجى الانتظار دقيقة واحدة قبل طلب رمز تحقق جديد.');
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    customer.resetPasswordOtp = hashedOtp;
    customer.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    customer.resetPasswordAttempts = 0;
    await this.customerRepo.save(customer);

    await this.mailService.sendPasswordResetOtp(customer.email, customer.fullName, otp);

    return {
      success: true,
      message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح.',
    };
  }

  async verifyResetOtp(dto: VerifyResetOtpDto): Promise<{ valid: boolean; message: string }> {
    const email = this.normalizeEmail(dto.email);
    const customer = await this.customerRepo
      .createQueryBuilder('c')
      .addSelect(['c.resetPasswordOtp', 'c.resetPasswordExpires', 'c.resetPasswordAttempts'])
      .where('c.email = :email', { email })
      .getOne();

    if (!customer || !customer.resetPasswordOtp) {
      throw new BadRequestException('رمز التحقق غير صالح أو لم يتم طلبه مسبقاً.');
    }

    if (customer.resetPasswordExpires && customer.resetPasswordExpires.getTime() < Date.now()) {
      throw new BadRequestException('انتهت صلاحية رمز التحقق (15 دقيقة)، يرجى طلب رمز جديد.');
    }

    if ((customer.resetPasswordAttempts || 0) >= 5) {
      customer.resetPasswordOtp = null;
      customer.resetPasswordExpires = null;
      await this.customerRepo.save(customer);
      throw new BadRequestException('تم تجاوز عدد المحاولات الخاطئة المسموح بها، يرجى طلب رمز جديد.');
    }

    const isMatch = await bcrypt.compare(dto.otp.trim(), customer.resetPasswordOtp);
    if (!isMatch) {
      customer.resetPasswordAttempts = (customer.resetPasswordAttempts || 0) + 1;
      await this.customerRepo.save(customer);
      const remaining = 5 - (customer.resetPasswordAttempts || 0);
      throw new BadRequestException(`رمز التحقق غير صحيح. تبقى لك ${remaining} محاولات.`);
    }

    return { valid: true, message: 'رمز التحقق صحيح ويمكنك الآن تعيين كلمة المرور الجديدة.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<CustomerAuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const customer = await this.customerRepo
      .createQueryBuilder('c')
      .addSelect(['c.resetPasswordOtp', 'c.resetPasswordExpires', 'c.resetPasswordAttempts'])
      .where('c.email = :email', { email })
      .getOne();

    if (!customer || !customer.resetPasswordOtp) {
      throw new BadRequestException('رمز التحقق غير صالح أو لم يتم طلبه مسبقاً.');
    }

    if (customer.resetPasswordExpires && customer.resetPasswordExpires.getTime() < Date.now()) {
      throw new BadRequestException('انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد.');
    }

    const isMatch = await bcrypt.compare(dto.otp.trim(), customer.resetPasswordOtp);
    if (!isMatch) {
      throw new BadRequestException('رمز التحقق غير صحيح، تعذر تغيير كلمة المرور.');
    }

    const hashed = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    customer.password = hashed;
    customer.resetPasswordOtp = null;
    customer.resetPasswordExpires = null;
    customer.resetPasswordAttempts = 0;
    await this.customerRepo.save(customer);

    return { access_token: this.signToken(customer), customer };
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customerRepo.findOne({ where: { id } });
  }

  private signToken(customer: Customer): string {
    const payload: CustomerJwtPayload = {
      sub: customer.id,
      email: customer.email,
      fullName: customer.fullName,
      role: 'customer',
    };
    return this.jwtService.sign(payload);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
