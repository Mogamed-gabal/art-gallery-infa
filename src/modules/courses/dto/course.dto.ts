import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

function toBoolean(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export class CreateCourseDto {
  @ApiProperty({ example: 'أساسيات الرسم الزيتي' })
  @IsString() @IsNotEmpty() @MaxLength(180)
  title!: string;

  @ApiProperty({ example: 'دورة تعريفية تساعدك على فهم مبادئ الرسم.' })
  @IsString() @IsNotEmpty()
  description!: string;

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
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(180)
  title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty()
  description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_protocol: true })
  externalUrl?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => toBoolean(value)) @IsBoolean()
  isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_protocol: true })
  welcomeVideoUrl?: string;
}
