import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateHeroDto {
  @ApiProperty({ example: 'Original Art, Lasting Emotion' })
  @IsString()
  @IsNotEmpty()
  titleAr!: string;

  @ApiPropertyOptional({ example: 'Original Art, Lasting Emotion' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty({ example: 'Discover a world painted with feeling.' })
  @IsString()
  @IsNotEmpty()
  subtitleAr!: string;

  @ApiPropertyOptional({ example: 'Discover a world painted with feeling.' })
  @IsOptional()
  @IsString()
  subtitleEn?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/demo/image/upload/hero.webp',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
