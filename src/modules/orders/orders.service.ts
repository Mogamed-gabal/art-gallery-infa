import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CurrencyService } from '../../shared/paypal/currency.service';
import { PayPalService } from '../../shared/paypal/paypal.service';
import { type Configuration } from '../../config/configuration';
import { Artwork, ArtworkStatus } from '../artworks/entities/artwork.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto, UpdateOrderStatusDto } from './dto/order.dto';
import {
  Order,
  OrderStatus,
  PaymentCurrency,
  PaymentStatus,
} from './entities/order.entity';
import { OrderItem, OrderItemType } from './entities/order-item.entity';

@Injectable()
export class OrdersService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(OrdersService.name);
  private cleanupInterval: NodeJS.Timeout | null = null;
  private static readonly EXPIRATION_MINUTES = 15;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepository: Repository<OrderItem>,
    @InjectRepository(Artwork)
    private readonly artworkRepository: Repository<Artwork>,
    private readonly paypal: PayPalService,
    private readonly currency: CurrencyService,
    private readonly config: ConfigService<Configuration>,
  ) {}

  onApplicationBootstrap() {
    this.cancelExpiredPendingOrders().catch((err) =>
      this.logger.error(`Initial cleanup error: ${String(err)}`),
    );
    this.cleanupInterval = setInterval(() => {
      this.cancelExpiredPendingOrders().catch((err) =>
        this.logger.error(`Periodic cleanup error: ${String(err)}`),
      );
    }, 60_000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  async create(
    dto: CreateOrderDto,
  ): Promise<{ order: Order; checkoutUrl: string }> {
    // Proactively release stock of any pending orders older than 15 minutes
    await this.cancelExpiredPendingOrders().catch((err) =>
      this.logger.error(`Error in pre-checkout cleanup: ${String(err)}`),
    );

    if (dto.items.length === 0)
      throw new BadRequestException('At least one order item is required');
    for (const item of dto.items)
      if (!item.artworkId)
        throw new BadRequestException(
          'Each order item must contain an artworkId',
        );

    const paymentCurrency: PaymentCurrency =
      dto.paymentCurrency ?? PaymentCurrency.USD;

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
        const totalUsd = items
          .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
          .toFixed(2);

        // Convert total from USD to the payment currency (EUR only; USD passes through)
        const convertedAmount = await this.currency.convertFromUsd(
          Number(totalUsd),
          paymentCurrency,
        );

        return manager.getRepository(Order).save(
          manager.getRepository(Order).create({
            orderNumber: `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 10)}`,
            customerName: dto.customerName,
            phone: dto.phone,
            whatsappPhone: dto.whatsappPhone ?? null,
            email: dto.email ?? null,
            shippingAddress: dto.shippingAddress,
            preferredDeliveryDate: dto.preferredDeliveryDate ?? null,
            totalAmount: totalUsd, // stored in USD
            totalAmountConverted: convertedAmount.toFixed(4),
            paymentCurrency,
            paymentStatus: PaymentStatus.PENDING,
            orderStatus: OrderStatus.PROCESSING,
            paypalOrderId: null,
            paypalCaptureId: null,
            courseEmailSentAt: null,
            items,
          }),
        );
      });

      // Build PayPal return/cancel URLs
      const frontendUrl =
        this.config.get('app.corsOrigin', { infer: true })?.split(',')[0] ??
        'http://localhost:4200';
      const returnUrl = `${frontendUrl}/checkout/success?orderId=${order.id}`;
      const cancelUrl = `${frontendUrl}/checkout/cancel?orderId=${order.id}`;

      const paypalResult = await this.paypal.createOrder(
        order.orderNumber,
        Number(order.totalAmountConverted ?? order.totalAmount),
        paymentCurrency,
        returnUrl,
        cancelUrl,
      );

      order.paypalOrderId = paypalResult.paypalOrderId;
      await this.orderRepository.save(order);

      return { order, checkoutUrl: paypalResult.approvalUrl };
    } catch (error) {
      if (order?.id) await this.releaseStock(order.id);
      throw error;
    }
  }

  /**
   * Called when the buyer returns from PayPal (return URL).
   * Captures the payment and marks the order as paid.
   */
  async capturePayment(
    orderId: string,
    paypalOrderId: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { items: { artwork: true } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) return order;

    // Verify PayPal order matches
    if (order.paypalOrderId && order.paypalOrderId !== paypalOrderId) {
      throw new BadRequestException('PayPal order ID mismatch');
    }

    try {
      const capture = await this.paypal.captureOrder(paypalOrderId);
      if (
        capture.status === 'COMPLETED' ||
        capture.status === 'APPROVED'
      ) {
        order.paypalCaptureId = capture.captureId;
        order.paymentStatus = PaymentStatus.PAID;
        order.orderStatus = OrderStatus.PROCESSING;
      } else {
        order.paymentStatus = PaymentStatus.FAILED;
        await this.releaseStock(order.id);
      }
    } catch (err) {
      this.logger.error(`PayPal capture failed for order ${orderId}: ${String(err)}`);
      order.paymentStatus = PaymentStatus.FAILED;
      await this.releaseStock(order.id);
    }
    return this.orderRepository.save(order);
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

  /**
   * Automatically cancels any orders that have remained PENDING for over 15 minutes,
   * returning reserved artwork stock back to AVAILABLE.
   */
  async cancelExpiredPendingOrders(): Promise<number> {
    const expirationThreshold = new Date(
      Date.now() - OrdersService.EXPIRATION_MINUTES * 60 * 1000,
    );

    const expiredOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.payment_status = :status', { status: PaymentStatus.PENDING })
      .andWhere('order.created_at <= :threshold', { threshold: expirationThreshold })
      .getMany();

    if (expiredOrders.length === 0) return 0;

    this.logger.log(
      `Found ${expiredOrders.length} expired pending order(s). Releasing stock and cancelling...`,
    );

    let count = 0;
    for (const order of expiredOrders) {
      try {
        await this.releaseStock(order.id);
        order.orderStatus = OrderStatus.CANCELLED;
        order.paymentStatus = PaymentStatus.CANCELLED;
        await this.orderRepository.save(order);
        count++;
        this.logger.log(`Auto-cancelled expired order #${order.orderNumber} (ID: ${order.id})`);
      } catch (err) {
        this.logger.error(
          `Failed to auto-cancel order ${order.id}: ${String(err)}`,
        );
      }
    }
    return count;
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


