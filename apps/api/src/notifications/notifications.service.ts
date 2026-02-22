import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  async processEvent(input: {
    eventType: string;
    payload: Record<string, unknown>;
    attempts: number;
  }): Promise<void> {
    const channel = this.resolveChannel(input.eventType);
    await this.notificationsRepository.insertDelivery({
      storeId: this.extractString(input.payload.storeId),
      orderId: this.extractString(input.payload.orderId),
      eventType: input.eventType,
      payload: input.payload,
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
    return 'system';
  }

  private extractString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
