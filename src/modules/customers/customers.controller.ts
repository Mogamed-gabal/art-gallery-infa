import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomersService, type CustomerAuthResponse } from './customers.service';
import {
  LoginCustomerDto,
  RegisterCustomerDto,
  GoogleCustomerLoginDto,
  ForgotPasswordDto,
  VerifyResetOtpDto,
  ResetPasswordDto,
} from './dto/customer-auth.dto';
import { CustomerAuthGuard } from './guards/customer-auth.guard';
import { type CustomerJwtPayload } from './strategies/customer-jwt.strategy';

@ApiTags('Customers Auth')
@Controller({ path: 'customers', version: '1' })
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new student/customer account' })
  register(@Body() dto: RegisterCustomerDto): Promise<CustomerAuthResponse> {
    return this.customersService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login for students/customers' })
  login(@Body() dto: LoginCustomerDto): Promise<CustomerAuthResponse> {
    return this.customersService.login(dto);
  }

  @Post('google-login')
  @ApiOperation({ summary: 'Login/Register students with Google' })
  googleLogin(@Body() dto: GoogleCustomerLoginDto): Promise<CustomerAuthResponse> {
    return this.customersService.googleLogin(dto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request 6-digit OTP code to reset password' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.customersService.forgotPassword(dto);
  }

  @Post('verify-reset-otp')
  @ApiOperation({ summary: 'Verify 6-digit OTP code for password reset' })
  verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.customersService.verifyResetOtp(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Set new password using verified OTP code' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<CustomerAuthResponse> {
    return this.customersService.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth('customer-token')
  @ApiOperation({ summary: 'Get current customer profile' })
  async getProfile(@Request() req: { user: CustomerJwtPayload }) {
    const customer = await this.customersService.findById(req.user.sub);
    return customer;
  }
}
