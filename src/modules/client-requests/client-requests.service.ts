import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../../shared/cloudinary/cloudinary.service';
import { CreateClientRequestDto } from './dto/create-client-request.dto';
import { ClientRequest } from './entities/client-request.entity';
@Injectable()
export class ClientRequestsService {
  constructor(@InjectRepository(ClientRequest) private readonly repository: Repository<ClientRequest>, private readonly cloudinary: CloudinaryService) {}
  async create(dto: CreateClientRequestDto, files: Express.Multer.File[]): Promise<ClientRequest> {
    if (files.length < 1 || files.length > 5) throw new BadRequestException('Please upload between 1 and 5 images');
    const uploads: { url: string; publicId: string }[] = [];
    try {
      for (const file of files) { const upload = await this.cloudinary.uploadImage(file); uploads.push({ url: upload.secureUrl, publicId: upload.publicId }); }
      return await this.repository.save(this.repository.create({
        ...dto,
        whatsapp: dto.whatsapp || dto.phone,
        images: uploads,
        status: 'NEW'
      }));
    } catch (error) {
      await Promise.allSettled(uploads.map((upload) => this.cloudinary.deleteAsset(upload.publicId)));
      throw error;
    }
  }
  findAll() { return this.repository.find({ order: { createdAt: 'DESC' } }); }
}
