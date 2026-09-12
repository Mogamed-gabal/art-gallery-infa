import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateContactDto {
  @ApiProperty({ example: 'Get in Touch' })
  @IsString()
  @IsNotEmpty()
  titleAr!: string;

  @ApiPropertyOptional({ example: 'Get in Touch' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({ example: 'For inquiries, commissions, and collaborations.' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ example: 'For inquiries, commissions, and collaborations.' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ example: '+201000000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://wa.me/201000000000' })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional({ example: 'artist@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    example: {
      instagram: 'https://instagram.com/artist',
      facebook: 'https://facebook.com/artist',
    },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;
}
