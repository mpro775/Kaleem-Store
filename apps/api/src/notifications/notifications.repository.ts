import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';

export type NotificationRecipientType = 'store' | 'store_user' | 'customer' | 'platform';
export type NotificationStatus = 'unread' | 'read';

export interface NotificationInboxRecord {
  id: string;
  store_id: string | null;
  recipient_type: NotificationRecipientType;
  recipient_store_user_id: string | null;
  recipient_customer_id: string | null;
  recipient_label: string | null;
  type: string;
  title: string;
  body: string;
  status: NotificationStatus;
  read_at: Date | null;
  action_url: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationPreferenceRecord {
  id: string;
  store_id: string | null;
  recipient_type: 'store' | 'store_user' | 'customer';
  recipient_store_user_id: string | null;
  recipient_customer_id: string | null;
  event_type: string;
  channel: 'inbox' | 'email';
  is_enabled: boolean;
  frequency: 'instant' | 'daily_digest' | 'mute';
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class NotificationsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async insertDelivery(input: {
    storeId: string | null;
    orderId: string | null;
    eventType: string;
    payload: Record<string, unknown>;
    channel: string;
    status: 'processed' | 'failed';
    attempts: number;
    errorMessage?: string;
  }): Promise<void> {
    await this.databaseService.db.query(
      `
        INSERT INTO notification_deliveries (
          id,
          store_id,
          order_id,
          event_type,
          payload,
          channel,
          status,
          attempts,
          error_message,
          processed_at
        ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, NOW())
      `,
      [
        uuidv4(),
        input.storeId,
        input.orderId,
        input.eventType,
        JSON.stringify(input.payload),
        input.channel,
        input.status,
        input.attempts,
        input.errorMessage ?? null,
      ],
    );
  }

  async insertInboxNotification(input: {
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
  }): Promise<NotificationInboxRecord> {
    const result = await this.databaseService.db.query<NotificationInboxRecord>(
      `
        INSERT INTO notifications (
          id,
          store_id,
          recipient_type,
          recipient_store_user_id,
          recipient_customer_id,
          recipient_label,
          type,
          title,
          body,
          status,
          action_url,
          metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, 'unread', $10, $11::jsonb
        )
        RETURNING
          id,
          store_id,
          recipient_type,
          recipient_store_user_id,
          recipient_customer_id,
          recipient_label,
          type,
          title,
          body,
          status,
          read_at,
          action_url,
          metadata,
          created_at,
          updated_at
      `,
      [
        uuidv4(),
        input.storeId,
        input.recipientType,
        input.recipientStoreUserId,
        input.recipientCustomerId,
        input.recipientLabel ?? null,
        input.type,
        input.title,
        input.body,
        input.actionUrl ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );

    return result.rows[0]!;
  }

  async listInboxForStore(input: {
    storeId: string;
    storeUserId: string;
    unreadOnly: boolean;
    type?: string;
    page: number;
    limit: number;
  }): Promise<{ rows: NotificationInboxRecord[]; total: number }> {
    const params: Array<string | number> = [input.storeId, input.storeUserId];
    const where: string[] = [
      'store_id = $1',
      "(recipient_type = 'store' OR (recipient_type = 'store_user' AND recipient_store_user_id = $2))",
    ];
    let index = 3;

    if (input.unreadOnly) {
      where.push(`status = $${index++}`);
      params.push('unread');
    }

    if (input.type?.trim()) {
      where.push(`type = $${index++}`);
      params.push(input.type.trim());
    }

    const whereClause = where.join(' AND ');
    const offset = (input.page - 1) * input.limit;

    const rowsResult = await this.databaseService.db.query<NotificationInboxRecord>(
      `
        SELECT
          id,
          store_id,
          recipient_type,
          recipient_store_user_id,
          recipient_customer_id,
          recipient_label,
          type,
          title,
          body,
          status,
          read_at,
          action_url,
          metadata,
          created_at,
          updated_at
        FROM notifications
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${index} OFFSET $${index + 1}
      `,
      [...params, input.limit, offset],
    );

    const countResult = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM notifications
        WHERE ${whereClause}
      `,
      params,
    );

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0]?.total ?? '0'),
    };
  }

  async listInboxForCustomer(input: {
    storeId: string;
    customerId: string;
    unreadOnly: boolean;
    type?: string;
    page: number;
    limit: number;
  }): Promise<{ rows: NotificationInboxRecord[]; total: number }> {
    const params: Array<string | number> = [input.storeId, input.customerId];
    const where: string[] = [
      'store_id = $1',
      "recipient_type = 'customer'",
      'recipient_customer_id = $2',
    ];
    let index = 3;

    if (input.unreadOnly) {
      where.push(`status = $${index++}`);
      params.push('unread');
    }

    if (input.type?.trim()) {
      where.push(`type = $${index++}`);
      params.push(input.type.trim());
    }

    const whereClause = where.join(' AND ');
    const offset = (input.page - 1) * input.limit;

    const rowsResult = await this.databaseService.db.query<NotificationInboxRecord>(
      `
        SELECT
          id,
          store_id,
          recipient_type,
          recipient_store_user_id,
          recipient_customer_id,
          recipient_label,
          type,
          title,
          body,
          status,
          read_at,
          action_url,
          metadata,
          created_at,
          updated_at
        FROM notifications
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${index} OFFSET $${index + 1}
      `,
      [...params, input.limit, offset],
    );

    const countResult = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM notifications
        WHERE ${whereClause}
      `,
      params,
    );

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0]?.total ?? '0'),
    };
  }

  async markReadForStore(input: {
    notificationId: string;
    storeId: string;
    storeUserId: string;
  }): Promise<boolean> {
    const result = await this.databaseService.db.query(
      `
        UPDATE notifications
        SET status = 'read',
            read_at = COALESCE(read_at, NOW()),
            updated_at = NOW()
        WHERE id = $1
          AND store_id = $2
          AND (
            recipient_type = 'store'
            OR (recipient_type = 'store_user' AND recipient_store_user_id = $3)
          )
      `,
      [input.notificationId, input.storeId, input.storeUserId],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async markReadForCustomer(input: {
    notificationId: string;
    storeId: string;
    customerId: string;
  }): Promise<boolean> {
    const result = await this.databaseService.db.query(
      `
        UPDATE notifications
        SET status = 'read',
            read_at = COALESCE(read_at, NOW()),
            updated_at = NOW()
        WHERE id = $1
          AND store_id = $2
          AND recipient_type = 'customer'
          AND recipient_customer_id = $3
      `,
      [input.notificationId, input.storeId, input.customerId],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async markAllReadForStore(storeId: string, storeUserId: string): Promise<number> {
    const result = await this.databaseService.db.query(
      `
        UPDATE notifications
        SET status = 'read',
            read_at = COALESCE(read_at, NOW()),
            updated_at = NOW()
        WHERE store_id = $1
          AND status = 'unread'
          AND (
            recipient_type = 'store'
            OR (recipient_type = 'store_user' AND recipient_store_user_id = $2)
          )
      `,
      [storeId, storeUserId],
    );

    return result.rowCount ?? 0;
  }

  async markAllReadForCustomer(storeId: string, customerId: string): Promise<number> {
    const result = await this.databaseService.db.query(
      `
        UPDATE notifications
        SET status = 'read',
            read_at = COALESCE(read_at, NOW()),
            updated_at = NOW()
        WHERE store_id = $1
          AND recipient_type = 'customer'
          AND recipient_customer_id = $2
          AND status = 'unread'
      `,
      [storeId, customerId],
    );

    return result.rowCount ?? 0;
  }

  async listPreferencesForStore(input: {
    storeId: string;
    storeUserId: string;
  }): Promise<NotificationPreferenceRecord[]> {
    const result = await this.databaseService.db.query<NotificationPreferenceRecord>(
      `
        SELECT
          id,
          store_id,
          recipient_type,
          recipient_store_user_id,
          recipient_customer_id,
          event_type,
          channel,
          is_enabled,
          frequency,
          created_at,
          updated_at
        FROM notification_preferences
        WHERE store_id = $1
          AND (
            recipient_type = 'store'
            OR (recipient_type = 'store_user' AND recipient_store_user_id = $2)
          )
        ORDER BY event_type ASC, channel ASC
      `,
      [input.storeId, input.storeUserId],
    );

    return result.rows;
  }

  async upsertPreferenceForStore(input: {
    storeId: string;
    recipientType: 'store' | 'store_user';
    recipientStoreUserId: string | null;
    eventType: string;
    channel: 'inbox' | 'email';
    isEnabled: boolean;
    frequency: 'instant' | 'daily_digest' | 'mute';
  }): Promise<void> {
    const updated = await this.databaseService.db.query(
      `
        UPDATE notification_preferences
        SET is_enabled = $6,
            frequency = $7,
            updated_at = NOW()
        WHERE store_id = $1
          AND recipient_type = $2
          AND (
            (recipient_store_user_id IS NULL AND $3::uuid IS NULL)
            OR recipient_store_user_id = $3
          )
          AND recipient_customer_id IS NULL
          AND event_type = $4
          AND channel = $5
      `,
      [
        input.storeId,
        input.recipientType,
        input.recipientStoreUserId,
        input.eventType,
        input.channel,
        input.isEnabled,
        input.frequency,
      ],
    );

    if ((updated.rowCount ?? 0) > 0) {
      return;
    }

    await this.databaseService.db.query(
      `
        INSERT INTO notification_preferences (
          id,
          store_id,
          recipient_type,
          recipient_store_user_id,
          recipient_customer_id,
          event_type,
          channel,
          is_enabled,
          frequency
        )
        VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8)
      `,
      [
        uuidv4(),
        input.storeId,
        input.recipientType,
        input.recipientStoreUserId,
        input.eventType,
        input.channel,
        input.isEnabled,
        input.frequency,
      ],
    );
  }
}
