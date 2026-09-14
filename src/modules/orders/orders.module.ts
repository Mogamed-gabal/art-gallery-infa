import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayPalModule } from '../../shared/paypal/paypal.module';
import { MailModule } from '../../shared/mail/mail.module';
import { Artwork } from '../artworks/entities/artwork.entity';
import { AuthModule } from '../auth/auth.module';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    AuthModule,
    PayPalModule,
    MailModule,
    TypeOrmModule.forFeature([Order, OrderItem, Artwork]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
