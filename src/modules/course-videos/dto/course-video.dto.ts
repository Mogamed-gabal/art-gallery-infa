import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

function toBoolean(v: unknown): unknown {
  if (v === 'true') return true;
  if (v === 'false') return false;
  return v;
}

export class CreateCourseVideoDto {
  @ApiProperty()
  @IsUUID()
  courseId!: string;

  @ApiProperty({ example: 'مقدمة في الرسم الزيتي' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  titleAr!: string;

  @ApiProperty({ example: 'Introduction to Oil Painting' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  titleEn!: string;

  @ApiPropertyOptional({ example: 'قصة ووصف محتوى هذا الدرس' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ example: 'Story and description of this lesson' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../video.mp4' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 'art-gallery/courses/videos/abc123' })
  @IsOptional()
  @IsString()
  cloudinaryPublicId?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  order!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  isWelcome?: boolean;

  @ApiPropertyOptional({ example: 360, description: 'Duration in seconds' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}

export class UpdateCourseVideoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(180) titleAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(180) titleEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() videoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cloudinaryPublicId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) order?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => toBoolean(value)) @IsBoolean() isWelcome?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) durationSeconds?: number;
}
