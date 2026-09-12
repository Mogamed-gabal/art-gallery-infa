import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  PaymobService,
  type PaymobWebhookPayload,
} from '../../shared/paymob/paymob.service';
import { Artwork, ArtworkStatus } from '../artworks/entities/artwork.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto, UpdateOrderStatusDto } from './dto/order.dto';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem, OrderItemType } from './entities/order-item.entity';

function primitiveString(value: unknown): string {
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
    ? String(value)
    : '';
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepository: Repository<OrderItem>,
    @InjectRepository(Artwork)
    private readonly artworkRepository: Repository<Artwork>,
    private readonly paymob: PaymobService,
  ) {}

  async create(
    dto: CreateOrderDto,
  ): Promise<{ order: Order; checkoutUrl: string }> {
    if (dto.items.length === 0)
      throw new BadRequestException('At least one order item is required');
    for (const item of dto.items)
      if (!item.artworkId)
        throw new BadRequestException(
          'Each order item must contain an artworkId',
        );
    let order!: Order;
    try {
      order = await this.dataSource.transaction(async (manager) => {
        const items: OrderItem[] = [];
        for (const input of dto.items) {
          const artwork = await manager
            .getRepository(Artwork)
            .createQueryBuilder('artwork')
            .where('artwork.id = :id', { id: input.artworkId })
            .setLock('pessimistic_write')
            .getOne();
          if (!artwork)
            throw new NotFoundException(`Artwork ${input.artworkId} not found`);
          if (
            artwork.status !== ArtworkStatus.AVAILABLE ||
            artwork.quantity < input.quantity
          )
            throw new BadRequestException(
              `Artwork ${input.artworkId} is unavailable or has insufficient stock`,
            );
          artwork.quantity -= input.quantity;
          artwork.status =
            artwork.quantity === 0
              ? ArtworkStatus.SOLD_OUT
              : ArtworkStatus.AVAILABLE;
          await manager.getRepository(Artwork).save(artwork);
          const price =
            artwork.onSale && artwork.discountPrice !== null
              ? artwork.discountPrice
              : artwork.price;
          items.push(
            manager.getRepository(OrderItem).create({
              artwork,
              itemType: OrderItemType.ARTWORK,
              quantity: input.quantity,
              price,
            }),
          );
        }
        const total = items
          .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
          .toFixed(2);
        return manager.getRepository(Order).save(
          manager.getRepository(Order).create({
            orderNumber: `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 10)}`,
            customerName: dto.customerName,
            phone: dto.phone,
            whatsappPhone: dto.whatsappPhone ?? null,
            email: dto.email ?? null,
            shippingAddress: dto.shippingAddress,
            preferredDeliveryDate: dto.preferredDeliveryDate ?? null,
            totalAmount: total,
            paymentStatus: PaymentStatus.PENDING,
            orderStatus: OrderStatus.PROCESSING,
            paymobOrderId: null,
            paymobTransactionId: null,
            courseEmailSentAt: null,
            items,
          }),
        );
      });
      const payment = await this.paymob.createPayment(
        order.orderNumber,
        order.totalAmount,
        order.email,
        order.customerName,
      );
      order.paymobOrderId = payment.paymobOrderId;
      await this.orderRepository.save(order);
      return { order, checkoutUrl: payment.checkoutUrl };
    } catch (error) {
      if (order?.id) await this.releaseStock(order.id);
      throw error;
    }
  }

  async handleWebhook(payload: PaymobWebhookPayload): Promise<void> {
    if (!this.paymob.verifyHmac(payload))
      throw new BadRequestException('Invalid Paymob HMAC');
    const obj = payload.obj;
    const paymobOrderId = primitiveString(obj?.order?.id ?? payload.order_id);
    const transactionId = primitiveString(obj?.id);
    const order = await this.orderRepository.findOne({
      where: { paymobOrderId },
      relations: { items: { artwork: true } },
    });
    if (!order) return;
    if (order.paymentStatus === PaymentStatus.PAID)
      return;
    order.paymobTransactionId = transactionId || order.paymobTransactionId;
    if (obj?.success === true || obj?.success === 'true') {
      order.paymentStatus = PaymentStatus.PAID;
      order.orderStatus = OrderStatus.PROCESSING;
      await this.orderRepository.save(order);
    } else {
      order.paymentStatus = PaymentStatus.FAILED;
      await this.orderRepository.save(order);
      await this.releaseStock(order.id);
    }
  }

  async findAll(
    query: OrderQueryDto,
  ): Promise<{ items: Order[]; meta: object }> {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.artwork', 'artwork')
      .orderBy('order.created_at', 'DESC');
    if (query.paymentStatus)
      qb.andWhere('order.payment_status = :paymentStatus', {
        paymentStatus: query.paymentStatus,
      });
    if (query.orderStatus)
      qb.andWhere('order.order_status = :orderStatus', {
        orderStatus: query.orderStatus,
      });
    const [items, total] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { items: { artwork: true } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    if (
      dto.orderStatus === OrderStatus.CANCELLED &&
      order.paymentStatus !== PaymentStatus.PAID &&
      order.paymentStatus !== PaymentStatus.CANCELLED
    ) {
      await this.releaseStock(order.id);
      order.paymentStatus = PaymentStatus.CANCELLED;
    }
    order.orderStatus = dto.orderStatus;
    return this.orderRepository.save(order);
  }

  private async releaseStock(orderId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager.getRepository(Order).findOne({
        where: { id: orderId },
        relations: { items: { artwork: true } },
      });
      if (!order || order.paymentStatus === PaymentStatus.PAID) return;
      for (const item of order.items) {
        if (!item.artwork || item.itemType !== OrderItemType.ARTWORK) continue;
        const artwork = await manager
          .getRepository(Artwork)
          .createQueryBuilder('artwork')
          .where('artwork.id = :id', { id: item.artwork.id })
          .setLock('pessimistic_write')
          .getOne();
        if (artwork) {
          artwork.quantity += item.quantity;
          artwork.status = ArtworkStatus.AVAILABLE;
          await manager.getRepository(Artwork).save(artwork);
        }
      }
      order.paymentStatus = PaymentStatus.FAILED;
      await manager.getRepository(Order).save(order);
    });
  }
}
