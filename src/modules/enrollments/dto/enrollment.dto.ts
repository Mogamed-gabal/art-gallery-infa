import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';

export class CreateEnrollmentOrderDto {
  @ApiProperty({ description: 'Target Course ID' })
  @IsUUID()
  @IsNotEmpty()
  courseId!: string;

  @ApiPropertyOptional({ enum: ['USD', 'EUR'], default: 'USD' })
  @IsOptional()
  @IsEnum(['USD', 'EUR'])
  currency?: 'USD' | 'EUR';

  @ApiPropertyOptional({ description: 'Frontend return URL after PayPal payment' })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @ApiPropertyOptional({ description: 'Frontend cancel URL if customer cancels PayPal' })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class CaptureEnrollmentDto {
  @ApiProperty({ description: 'Target Course ID' })
  @IsUUID()
  @IsNotEmpty()
  courseId!: string;

  @ApiProperty({ description: 'PayPal Order ID returned by create-order' })
  @IsString()
  @IsNotEmpty()
  paypalOrderId!: string;
}

export class AdminGrantEnrollmentDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail()
  customerEmail!: string;

  @ApiProperty({ description: 'Target Course ID' })
  @IsUUID()
  @IsNotEmpty()
  courseId!: string;
}
