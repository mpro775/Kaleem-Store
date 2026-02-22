import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';

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
}
