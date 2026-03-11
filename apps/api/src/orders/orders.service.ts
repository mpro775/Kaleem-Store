import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import type { RequestContextData } from '../common/utils/request-context.util';
import { InventoryService, type LowStockSignal } from '../inventory/inventory.service';
import type { Queryable } from '../inventory/inventory.repository';
import { OutboxService } from '../messaging/outbox.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { canTransitionOrderStatus, type OrderStatus } from './constants/order-status.constants';
import type { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  OrdersRepository,
  type OrderItemRecord,
  type OrderRecord,
  type OrderStatusHistoryRecord,
} from './orders.repository';

export interface OrderResponse {
  id: string;
  orderCode: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  currencyCode: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDetailResponse extends OrderResponse {
  items: Array<{
    id: string;
    productId: string;
    variantId: string;
    title: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  timeline: Array<{
    from: string | null;
    to: string;
    note: string | null;
    createdAt: Date;
  }>;
  payment: {
    id: string;
    method: string;
    status: string;
    amount: number;
    receiptUrl: string | null;
  } | null;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly webhooksService: WebhooksService,
  ) {}

  async list(currentUser: AuthUser, query: ListOrdersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.ordersRepository.listOrders({
      storeId: currentUser.storeId,
      status: query.status,
      q: query.q?.trim(),
      limit,
      offset: (page - 1) * limit,
    });

    return {
      items: result.rows.map((order) => this.mapOrder(order)),
      total: result.total,
      page,
      limit,
    };
  }

  async getById(currentUser: AuthUser, orderId: string): Promise<OrderDetailResponse> {
    const order = await this.requireOrder(currentUser.storeId, orderId);
    const [items, timeline, payment] = await Promise.all([
      this.ordersRepository.listOrderItems(orderId),
      this.ordersRepository.listOrderStatusHistory(orderId),
      this.ordersRepository.findPaymentByOrderId(orderId),
    ]);

    return {
      ...this.mapOrder(order),
      items: items.map((item) => this.mapOrderItem(item)),
      timeline: timeline.map((entry) => this.mapOrderHistory(entry)),
      payment: payment
        ? {
            id: payment.id,
            method: payment.method,
            status: payment.status,
            amount: Number(payment.amount),
            receiptUrl: payment.receipt_url,
          }
        : null,
    };
  }

  async updateStatus(
    currentUser: AuthUser,
    orderId: string,
    input: UpdateOrderStatusDto,
    context: RequestContextData,
  ): Promise<OrderDetailResponse> {
    const order = await this.requireOrder(currentUser.storeId, orderId);
    this.ensureTransitionAllowed(order.status, input.status);

    const items = await this.ordersRepository.listOrderItems(orderId);
    const lowStockSignals: LowStockSignal[] = [];

    await this.ordersRepository.withTransaction(async (db) => {
      await this.inventoryService.releaseExpiredReservationsInTransaction(db, currentUser.storeId);
      const transitionSignals = await this.applyInventoryTransition(db, {
        orderId,
        currentStatus: order.status,
        nextStatus: input.status,
        storeId: currentUser.storeId,
        items,
        actorId: currentUser.id,
      });
      lowStockSignals.push(...transitionSignals);

      await this.ordersRepository.updateOrderStatus(db, {
        orderId,
        storeId: currentUser.storeId,
        nextStatus: input.status,
      });

      await this.ordersRepository.insertOrderStatusHistory(db, {
        storeId: currentUser.storeId,
        orderId,
        oldStatus: order.status,
        newStatus: input.status,
        changedBy: currentUser.id,
        note: input.note?.trim() ?? null,
      });
    });

    await this.inventoryService.publishLowStockAlerts(lowStockSignals);
    await this.logAndPublishStatusChange(currentUser, order, input.status, input.note, context);
    await this.webhooksService.dispatchEvent(currentUser.storeId, 'order.updated', {
      orderId,
      orderCode: order.order_code,
      previousStatus: order.status,
      status: input.status,
      note: input.note?.trim() ?? null,
    });
    return this.getById(currentUser, orderId);
  }

  private async requireOrder(storeId: string, orderId: string): Promise<OrderRecord> {
    const order = await this.ordersRepository.findOrderById(storeId, orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  private ensureTransitionAllowed(current: OrderStatus, next: OrderStatus): void {
    if (current === next) {
      throw new BadRequestException('Order is already in the requested status');
    }

    if (!canTransitionOrderStatus(current, next)) {
      throw new BadRequestException(`Order cannot transition from ${current} to ${next}`);
    }
  }

  private async applyInventoryTransition(
    db: Queryable,
    input: {
      orderId: string;
      currentStatus: OrderStatus;
      nextStatus: OrderStatus;
      storeId: string;
      items: OrderItemRecord[];
      actorId: string | null;
    },
  ): Promise<LowStockSignal[]> {
    if (input.currentStatus === 'new' && input.nextStatus === 'confirmed') {
      return this.inventoryService.confirmReservedOrderItems(db, {
        storeId: input.storeId,
        orderId: input.orderId,
        items: this.mapInventoryItems(input.items),
        actorId: input.actorId,
      });
    }

    if (input.currentStatus === 'new' && input.nextStatus === 'cancelled') {
      await this.releaseOrderReservations(db, input.storeId, input.orderId);
      return [];
    }

    if (this.isCancellationAfterStockDeduction(input.currentStatus, input.nextStatus)) {
      await this.restockCancelledOrder(db, input);
      return [];
    }

    if (input.currentStatus === 'out_for_delivery' && input.nextStatus === 'returned') {
      await this.restockReturnedOrder(db, input);
      return [];
    }

    return [];
  }

  private mapInventoryItems(items: OrderItemRecord[]): Array<{
    variantId: string;
    quantity: number;
    sku: string;
  }> {
    return items.map((item) => ({
      variantId: item.variant_id,
      quantity: item.quantity,
      sku: item.sku,
    }));
  }

  private isCancellationAfterStockDeduction(
    currentStatus: OrderStatus,
    nextStatus: OrderStatus,
  ): boolean {
    return (
      nextStatus === 'cancelled' && (currentStatus === 'confirmed' || currentStatus === 'preparing')
    );
  }

  private async releaseOrderReservations(
    db: Queryable,
    storeId: string,
    orderId: string,
  ): Promise<void> {
    await this.inventoryService.releaseOrderReservations(db, {
      storeId,
      orderId,
      reason: 'order_cancelled',
    });
  }

  private async restockCancelledOrder(
    db: Queryable,
    input: {
      orderId: string;
      storeId: string;
      items: OrderItemRecord[];
      actorId: string | null;
    },
  ): Promise<void> {
    await this.inventoryService.restockOrderItems(db, {
      storeId: input.storeId,
      orderId: input.orderId,
      items: this.mapInventoryItems(input.items),
      actorId: input.actorId,
      note: 'Stock returned after order cancellation',
      movementType: 'return',
    });
  }

  private async restockReturnedOrder(
    db: Queryable,
    input: {
      orderId: string;
      storeId: string;
      items: OrderItemRecord[];
      actorId: string | null;
    },
  ): Promise<void> {
    await this.inventoryService.restockOrderItems(db, {
      storeId: input.storeId,
      orderId: input.orderId,
      items: this.mapInventoryItems(input.items),
      actorId: input.actorId,
      note: 'Stock returned from delivered order',
      movementType: 'return',
    });
  }

  private async logAndPublishStatusChange(
    currentUser: AuthUser,
    order: OrderRecord,
    nextStatus: OrderStatus,
    note: string | undefined,
    context: RequestContextData,
  ): Promise<void> {
    await this.auditService.log({
      action: 'orders.status_updated',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'order',
      targetId: order.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        from: order.status,
        to: nextStatus,
        note: note ?? null,
        requestId: context.requestId,
      },
    });

    await this.outboxService.enqueue({
      aggregateType: 'order',
      aggregateId: order.id,
      eventType: 'order.status.changed',
      payload: {
        orderId: order.id,
        orderCode: order.order_code,
        from: order.status,
        to: nextStatus,
        storeId: currentUser.storeId,
      },
      headers: context.requestId ? { requestId: context.requestId } : {},
    });
  }

  private mapOrder(order: OrderRecord): OrderResponse {
    return {
      id: order.id,
      orderCode: order.order_code,
      status: order.status,
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      currencyCode: order.currency_code,
      note: order.note,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  }

  private mapOrderItem(item: OrderItemRecord) {
    return {
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      title: item.title,
      sku: item.sku,
      unitPrice: Number(item.unit_price),
      quantity: item.quantity,
      lineTotal: Number(item.line_total),
    };
  }

  private mapOrderHistory(entry: OrderStatusHistoryRecord) {
    return {
      from: entry.old_status,
      to: entry.new_status,
      note: entry.note,
      createdAt: entry.created_at,
    };
  }
}
