import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../../shared/cloudinary/cloudinary.module';
import { ClientRequest } from './entities/client-request.entity';
import { ClientRequestsController } from './client-requests.controller';
import { ClientRequestsService } from './client-requests.service';
@Module({ imports: [TypeOrmModule.forFeature([ClientRequest]), CloudinaryModule], controllers: [ClientRequestsController], providers: [ClientRequestsService] })
export class ClientRequestsModule {}
