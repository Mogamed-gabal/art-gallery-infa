import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateClientRequestDto } from './dto/create-client-request.dto';
import { ClientRequestsService } from './client-requests.service';
@ApiTags('Client Requests')
@Controller({ path: 'client-requests', version: '1' })
export class ClientRequestsController {
  constructor(private readonly service: ClientRequestsService) {}
  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 5 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  create(
    @Body() dto: CreateClientRequestDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.service.create(dto, files ?? []);
  }
  @Get() @UseGuards(JwtAuthGuard) @ApiBearerAuth('access-token') findAll() {
    return this.service.findAll();
  }
}
