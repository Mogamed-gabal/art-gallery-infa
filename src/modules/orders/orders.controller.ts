import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

@ApiBearerAuth('access-token')
@ApiTags('orders')
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create checkout order and reserve artwork stock' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  /**
   * PayPal redirects the buyer to this endpoint after approval.
   * The frontend should call this URL to capture the payment.
   * Query params: orderId (our DB order ID), token (PayPal order ID), PayerID
   */
  @Post('capture')
  @ApiOperation({ summary: 'Capture PayPal payment after buyer approval' })
  capture(
    @Query('orderId') orderId: string,
    @Query('token') paypalOrderId: string,
  ) {
    return this.ordersService.capturePayment(orderId, paypalOrderId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
