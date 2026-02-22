import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import type { PaymentMethod, PaymentStatus } from './constants/payment.constants';

export interface PaymentRecord {
  id: string;
  store_id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: string;
  receipt_url: string | null;
  receipt_media_asset_id: string | null;
  reviewed_at: Date | null;
  reviewed_by: string | null;
  review_note: string | null;
  customer_uploaded_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentWithOrder extends PaymentRecord {
  order_code: string;
  order_status: string;
  order_total: string;
}

@Injectable()
export class PaymentsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByOrderId(storeId: string, orderId: string): Promise<PaymentRecord | null> {
    const result = await this.databaseService.db.query<PaymentRecord>(
      `
        SELECT id, store_id, order_id, method, status, amount, receipt_url,
               receipt_media_asset_id, reviewed_at, reviewed_by, review_note,
               customer_uploaded_at, created_at, updated_at
        FROM payments
        WHERE store_id = $1 AND order_id = $2
        LIMIT 1
      `,
      [storeId, orderId],
    );
    return result.rows[0] ?? null;
  }

  async findById(storeId: string, paymentId: string): Promise<PaymentRecord | null> {
    const result = await this.databaseService.db.query<PaymentRecord>(
      `
        SELECT id, store_id, order_id, method, status, amount, receipt_url,
               receipt_media_asset_id, reviewed_at, reviewed_by, review_note,
               customer_uploaded_at, created_at, updated_at
        FROM payments
        WHERE store_id = $1 AND id = $2
        LIMIT 1
      `,
      [storeId, paymentId],
    );
    return result.rows[0] ?? null;
  }

  async listByStore(
    storeId: string,
    filters?: { orderId?: string; status?: PaymentStatus },
  ): Promise<PaymentWithOrder[]> {
    const conditions: string[] = ['p.store_id = $1'];
    const values: unknown[] = [storeId];
    let paramIndex = 2;

    if (filters?.orderId) {
      conditions.push(`p.order_id = $${paramIndex}`);
      values.push(filters.orderId);
      paramIndex++;
    }

    if (filters?.status) {
      conditions.push(`p.status = $${paramIndex}`);
      values.push(filters.status);
      paramIndex++;
    }

    const result = await this.databaseService.db.query<PaymentWithOrder>(
      `
        SELECT p.id, p.store_id, p.order_id, p.method, p.status, p.amount, p.receipt_url,
               p.receipt_media_asset_id, p.reviewed_at, p.reviewed_by, p.review_note,
               p.customer_uploaded_at, p.created_at, p.updated_at,
               o.order_code, o.status AS order_status, o.total AS order_total
        FROM payments p
        INNER JOIN orders o ON o.id = p.order_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY p.created_at DESC
      `,
      values,
    );

    return result.rows;
  }

  async listPendingReview(storeId: string): Promise<PaymentWithOrder[]> {
    const result = await this.databaseService.db.query<PaymentWithOrder>(
      `
        SELECT p.id, p.store_id, p.order_id, p.method, p.status, p.amount, p.receipt_url,
               p.receipt_media_asset_id, p.reviewed_at, p.reviewed_by, p.review_note,
               p.customer_uploaded_at, p.created_at, p.updated_at,
               o.order_code, o.status AS order_status, o.total AS order_total
        FROM payments p
        INNER JOIN orders o ON o.id = p.order_id
        WHERE p.store_id = $1
          AND p.status = 'under_review'
        ORDER BY p.customer_uploaded_at ASC NULLS LAST, p.created_at ASC
      `,
      [storeId],
    );

    return result.rows;
  }

  async updateReceipt(input: {
    paymentId: string;
    storeId: string;
    receiptMediaAssetId: string;
    receiptUrl: string;
  }): Promise<PaymentRecord | null> {
    const result = await this.databaseService.db.query<PaymentRecord>(
      `
        UPDATE payments
        SET receipt_media_asset_id = $3,
            receipt_url = $4,
            customer_uploaded_at = NOW(),
            status = 'under_review',
            updated_at = NOW()
        WHERE id = $1
          AND store_id = $2
          AND method = 'transfer'
        RETURNING id, store_id, order_id, method, status, amount, receipt_url,
                  receipt_media_asset_id, reviewed_at, reviewed_by, review_note,
                  customer_uploaded_at, created_at, updated_at
      `,
      [input.paymentId, input.storeId, input.receiptMediaAssetId, input.receiptUrl],
    );
    return result.rows[0] ?? null;
  }

  async updateStatus(input: {
    paymentId: string;
    storeId: string;
    status: PaymentStatus;
    reviewedBy: string | null;
    reviewNote: string | null;
  }): Promise<PaymentRecord | null> {
    const reviewedAt = input.status === 'approved' || input.status === 'rejected' ? 'NOW()' : null;
    const result = await this.databaseService.db.query<PaymentRecord>(
      `
        UPDATE payments
        SET status = $3,
            reviewed_by = COALESCE($4, reviewed_by),
            review_note = COALESCE($5, review_note),
            reviewed_at = COALESCE(${reviewedAt ? 'NOW()' : 'NULL'}, reviewed_at),
            updated_at = NOW()
        WHERE id = $1
          AND store_id = $2
        RETURNING id, store_id, order_id, method, status, amount, receipt_url,
                  receipt_media_asset_id, reviewed_at, reviewed_by, review_note,
                  customer_uploaded_at, created_at, updated_at
      `,
      [input.paymentId, input.storeId, input.status, input.reviewedBy, input.reviewNote],
    );
    return result.rows[0] ?? null;
  }

  async create(input: {
    storeId: string;
    orderId: string;
    method: PaymentMethod;
    amount: number;
  }): Promise<PaymentRecord> {
    const id = uuidv4();
    const result = await this.databaseService.db.query<PaymentRecord>(
      `
        INSERT INTO payments (id, store_id, order_id, method, status, amount)
        VALUES ($1, $2, $3, $4, 'pending', $5)
        RETURNING id, store_id, order_id, method, status, amount, receipt_url,
                  receipt_media_asset_id, reviewed_at, reviewed_by, review_note,
                  customer_uploaded_at, created_at, updated_at
      `,
      [id, input.storeId, input.orderId, input.method, input.amount],
    );
    return result.rows[0]!;
  }
}
