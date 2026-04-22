import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CustomerEngagementService } from '../customers/customer-engagement.service';
import type { CustomerUser } from '../customers/interfaces/customer-user.interface';
import {
  NotificationsRepository,
  type NotificationInboxRecord,
  type NotificationPreferenceRecord,
  type NotificationRecipientType,
} from './notifications.repository';

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
    const storeId = this.extractString(input.payload.storeId);
    const orderId = this.extractString(input.payload.orderId);

    if (input.eventType === 'inventory.back_in_stock') {
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

    if (storeId) {
      await this.createInboxFromEvent({
        storeId,
        orderId,
        eventType: input.eventType,
        payload,
      });
    }
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

    const storeId = this.extractString(input.payload.storeId);
    if (storeId) {
      await this.createInboxNotification({
        storeId,
        recipientType: 'store',
        recipientStoreUserId: null,
        recipientCustomerId: null,
        type: 'notification.delivery.failed',
        title: `Notification delivery failed: ${input.eventType}`,
        body: input.errorMessage,
        actionUrl: '/merchant?tab=notificationsCenter',
        metadata: {
          eventType: input.eventType,
          attempts: input.attempts,
        },
      });
    }
  }

  async createInboxNotification(input: {
    storeId: string | null;
    recipientType: NotificationRecipientType;
    recipientStoreUserId: string | null;
    recipientCustomerId: string | null;
    recipientLabel?: string | null;
    type: string;
    title: string;
    body: string;
    actionUrl?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const inserted = await this.notificationsRepository.insertInboxNotification({
      storeId: input.storeId,
      recipientType: input.recipientType,
      recipientStoreUserId: input.recipientStoreUserId,
      recipientCustomerId: input.recipientCustomerId,
      type: input.type,
      title: input.title,
      body: input.body,
      ...(input.recipientLabel !== undefined ? { recipientLabel: input.recipientLabel } : {}),
      ...(input.actionUrl !== undefined ? { actionUrl: input.actionUrl } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    });

    return this.mapInbox(inserted);
  }

  async listStoreInbox(
    currentUser: AuthUser,
    query: {
      unreadOnly: boolean;
      type?: string;
      page: number;
      limit: number;
    },
  ): Promise<{ items: Record<string, unknown>[]; total: number; page: number; limit: number }> {
    const result = await this.notificationsRepository.listInboxForStore({
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      unreadOnly: query.unreadOnly,
      page: query.page,
      limit: query.limit,
      ...(query.type !== undefined ? { type: query.type } : {}),
    });

    return {
      items: result.rows.map((item) => this.mapInbox(item)),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  async listCustomerInbox(
    customer: CustomerUser,
    query: {
      unreadOnly: boolean;
      type?: string;
      page: number;
      limit: number;
    },
  ): Promise<{ items: Record<string, unknown>[]; total: number; page: number; limit: number }> {
    const result = await this.notificationsRepository.listInboxForCustomer({
      storeId: customer.storeId,
      customerId: customer.id,
      unreadOnly: query.unreadOnly,
      page: query.page,
      limit: query.limit,
      ...(query.type !== undefined ? { type: query.type } : {}),
    });

    return {
      items: result.rows.map((item) => this.mapInbox(item)),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  async markStoreNotificationRead(currentUser: AuthUser, notificationId: string): Promise<void> {
    const updated = await this.notificationsRepository.markReadForStore({
      notificationId,
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
    });
    if (!updated) {
      throw new NotFoundException('Notification not found');
    }
  }

  async markCustomerNotificationRead(customer: CustomerUser, notificationId: string): Promise<void> {
    const updated = await this.notificationsRepository.markReadForCustomer({
      notificationId,
      storeId: customer.storeId,
      customerId: customer.id,
    });
    if (!updated) {
      throw new NotFoundException('Notification not found');
    }
  }

  async markAllStoreNotificationsRead(currentUser: AuthUser): Promise<{ updated: number }> {
    const updated = await this.notificationsRepository.markAllReadForStore(
      currentUser.storeId,
      currentUser.id,
    );
    return { updated };
  }

  async markAllCustomerNotificationsRead(customer: CustomerUser): Promise<{ updated: number }> {
    const updated = await this.notificationsRepository.markAllReadForCustomer(
      customer.storeId,
      customer.id,
    );
    return { updated };
  }

  async listStorePreferences(currentUser: AuthUser): Promise<Record<string, unknown>[]> {
    const rows = await this.notificationsRepository.listPreferencesForStore({
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
    });
    return rows.map((row) => this.mapPreference(row));
  }

  async updateStorePreferences(
    currentUser: AuthUser,
    input: Array<{
      eventType: string;
      channel: 'inbox' | 'email';
      isEnabled: boolean;
      frequency: 'instant' | 'daily_digest' | 'mute';
      target: 'store' | 'store_user';
    }>,
  ): Promise<{ updated: number }> {
    let updated = 0;
    for (const item of input) {
      await this.notificationsRepository.upsertPreferenceForStore({
        storeId: currentUser.storeId,
        recipientType: item.target,
        recipientStoreUserId: item.target === 'store_user' ? currentUser.id : null,
        eventType: item.eventType,
        channel: item.channel,
        isEnabled: item.isEnabled,
        frequency: item.frequency,
      });
      updated += 1;
    }
    return { updated };
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

  private async createInboxFromEvent(input: {
    storeId: string;
    orderId: string | null;
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    if (input.eventType === 'order.created') {
      await this.createInboxNotification({
        storeId: input.storeId,
        recipientType: 'store',
        recipientStoreUserId: null,
        recipientCustomerId: null,
        type: 'order.created',
        title: 'New order created',
        body: `Order ${this.extractString(input.payload.orderCode) ?? ''} was created.`.trim(),
        actionUrl: '/merchant?tab=orders',
        metadata: input.orderId ? { orderId: input.orderId } : {},
      });
      return;
    }

    if (input.eventType === 'order.status.changed') {
      await this.createInboxNotification({
        storeId: input.storeId,
        recipientType: 'store',
        recipientStoreUserId: null,
        recipientCustomerId: null,
        type: 'order.status.changed',
        title: 'Order status changed',
        body: `Order ${this.extractString(input.payload.orderCode) ?? ''} moved to ${this.extractString(input.payload.to) ?? 'new status'}.`,
        actionUrl: '/merchant?tab=orders',
        metadata: input.orderId ? { orderId: input.orderId } : {},
      });
      return;
    }

    if (input.eventType === 'inventory.low_stock') {
      await this.createInboxNotification({
        storeId: input.storeId,
        recipientType: 'store',
        recipientStoreUserId: null,
        recipientCustomerId: null,
        type: 'inventory.low_stock',
        title: 'Low stock alert',
        body: `${this.extractString(input.payload.productTitle) ?? 'Product'} is low in stock.`,
        actionUrl: '/merchant?tab=inventory',
        metadata: input.payload,
      });
      return;
    }

    if (input.eventType === 'inventory.back_in_stock') {
      await this.createInboxNotification({
        storeId: input.storeId,
        recipientType: 'store',
        recipientStoreUserId: null,
        recipientCustomerId: null,
        type: 'inventory.back_in_stock',
        title: 'Back in stock notifications dispatched',
        body: `Sent: ${String(input.payload.sentCount ?? 0)}, Failed: ${String(input.payload.failedCount ?? 0)}.`,
        actionUrl: '/merchant?tab=restockAlerts',
        metadata: input.payload,
      });
    }
  }

  private mapInbox(row: NotificationInboxRecord): Record<string, unknown> {
    return {
      id: row.id,
      storeId: row.store_id,
      recipientType: row.recipient_type,
      recipientStoreUserId: row.recipient_store_user_id,
      recipientCustomerId: row.recipient_customer_id,
      recipientLabel: row.recipient_label,
      type: row.type,
      title: row.title,
      body: row.body,
      status: row.status,
      readAt: row.read_at,
      actionUrl: row.action_url,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapPreference(row: NotificationPreferenceRecord): Record<string, unknown> {
    return {
      id: row.id,
      storeId: row.store_id,
      recipientType: row.recipient_type,
      recipientStoreUserId: row.recipient_store_user_id,
      recipientCustomerId: row.recipient_customer_id,
      eventType: row.event_type,
      channel: row.channel,
      isEnabled: row.is_enabled,
      frequency: row.frequency,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
