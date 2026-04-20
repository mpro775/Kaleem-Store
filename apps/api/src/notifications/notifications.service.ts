import { Injectable } from '@nestjs/common';
import { CustomerEngagementService } from '../customers/customer-engagement.service';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly customerEngagementService: CustomerEngagementService,
  ) {}

  async processEvent(input: {
    eventType: string;
    payload: Record<string, unknown>;
    attempts: number;
  }): Promise<void> {
    let payload = input.payload;
    if (input.eventType === 'inventory.back_in_stock') {
      const storeId = this.extractString(input.payload.storeId);
      const productId = this.extractString(input.payload.productId);
      const variantId = this.extractString(input.payload.variantId);

      if (storeId && productId) {
        const dispatch = await this.customerEngagementService.dispatchBackInStockNotifications({
          storeId,
          productId,
          ...(variantId ? { variantId } : {}),
        });
        payload = {
          ...input.payload,
          sentCount: dispatch.sentCount,
          failedCount: dispatch.failedCount,
        };
      }
    }

    const channel = this.resolveChannel(input.eventType);
    await this.notificationsRepository.insertDelivery({
      storeId: this.extractString(payload.storeId),
      orderId: this.extractString(payload.orderId),
      eventType: input.eventType,
      payload,
      channel,
      status: 'processed',
      attempts: input.attempts,
    });
  }

  async markFailure(input: {
    eventType: string;
    payload: Record<string, unknown>;
    attempts: number;
    errorMessage: string;
  }): Promise<void> {
    await this.notificationsRepository.insertDelivery({
      storeId: this.extractString(input.payload.storeId),
      orderId: this.extractString(input.payload.orderId),
      eventType: input.eventType,
      payload: input.payload,
      channel: this.resolveChannel(input.eventType),
      status: 'failed',
      attempts: input.attempts,
      errorMessage: input.errorMessage,
    });
  }

  private resolveChannel(eventType: string): string {
    if (eventType === 'order.created') {
      return 'merchant';
    }
    if (eventType === 'order.status.changed') {
      return 'customer';
    }
    if (eventType === 'inventory.low_stock') {
      return 'merchant';
    }
    if (eventType === 'inventory.back_in_stock') {
      return 'customer';
    }
    return 'system';
  }

  private extractString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
