import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAboutDto {
  @ApiProperty({ example: 'About the Artist' })
  @IsString()
  @IsNotEmpty()
  titleAr!: string;

  @ApiPropertyOptional({ example: 'About the Artist' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty({
    example: 'A visual artist inspired by memory, light, and human connection.',
  })
  @IsString()
  @IsNotEmpty()
  bioAr!: string;

  @ApiPropertyOptional({
    example: 'A visual artist inspired by memory, light, and human connection.',
  })
  @IsOptional()
  @IsString()
  bioEn?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/demo/image/upload/about-1.webp',
  })
  @IsOptional()
  @IsString()
  image1Url?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/demo/image/upload/about-2.webp',
  })
  @IsOptional()
  @IsString()
  image2Url?: string;
}
