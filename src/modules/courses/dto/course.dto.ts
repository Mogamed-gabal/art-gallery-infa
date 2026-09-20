import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

function toBoolean(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export class CreateCourseDto {
  @ApiPropertyOptional({ example: 'أساسيات الرسم الزيتي' })
  @IsOptional() @IsString() @MaxLength(180)
  titleAr?: string;

  @ApiPropertyOptional({ example: 'Oil Painting Fundamentals' })
  @IsOptional() @IsString() @MaxLength(180)
  titleEn?: string;

  @ApiPropertyOptional({ example: 'دورة شاملة في مبادئ الرسم الزيتي' })
  @IsOptional() @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ example: 'Comprehensive course on oil painting principles' })
  @IsOptional() @IsString()
  descriptionEn?: string;

  // Backwards compatibility fallback
  @ApiPropertyOptional({ example: 'أساسيات الرسم الزيتي' })
  @IsOptional() @IsString() @MaxLength(180)
  title?: string;

  @ApiPropertyOptional({ example: 'دورة تعريفية تساعدك على فهم مبادئ الرسم.' })
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ example: 'https://courses.example.com/oil-painting' })
  @IsUrl({ require_protocol: true })
  externalUrl!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @Transform(({ value }) => toBoolean(value)) @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/demo/video/upload/welcome.mp4' })
  @IsOptional() @IsUrl({ require_protocol: true })
  welcomeVideoUrl?: string;
}

export class UpdateCourseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(180)
  titleAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(180)
  titleEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()
  descriptionAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()
  descriptionEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(180)
  title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()
  description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_protocol: true })
  externalUrl?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => toBoolean(value)) @IsBoolean()
  isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_protocol: true })
  welcomeVideoUrl?: string;
}
