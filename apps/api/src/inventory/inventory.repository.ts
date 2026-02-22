import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import type {
  InventoryMovementType,
  InventoryReservationStatus,
} from './constants/inventory.constants';

export interface Queryable {
  query: <T = unknown>(
    queryText: string,
    values?: unknown[],
  ) => Promise<{ rows: T[]; rowCount: number | null }>;
}

export interface InventoryMovementRecord {
  id: string;
  store_id: string;
  variant_id: string;
  order_id: string | null;
  movement_type: InventoryMovementType;
  qty_delta: number;
  note: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: Date;
  product_id: string;
  product_title: string;
  variant_title: string;
  sku: string;
}

export interface InventoryReservationRecord {
  id: string;
  store_id: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  status: InventoryReservationStatus;
  reserved_at: Date;
  expires_at: Date;
  released_at: Date | null;
  consumed_at: Date | null;
  release_reason: string | null;
  metadata: Record<string, unknown>;
  updated_at: Date;
  product_id: string;
  product_title: string;
  variant_title: string;
  sku: string;
}

export interface VariantInventorySnapshotRecord {
  variant_id: string;
  product_id: string;
  sku: string;
  product_title: string;
  variant_title: string;
  stock_quantity: number;
  low_stock_threshold: number;
  reserved_quantity: number;
  available_quantity: number;
}

export interface VariantStockChangeRecord {
  variant_id: string;
  product_id: string;
  sku: string;
  low_stock_threshold: number;
  previous_stock_quantity: number;
  current_stock_quantity: number;
}

const LIST_MOVEMENTS_ROWS_QUERY = `
  SELECT
    im.id,
    im.store_id,
    im.variant_id,
    im.order_id,
    im.movement_type,
    im.qty_delta,
    im.note,
    im.metadata,
    im.created_by,
    im.created_at,
    pv.product_id,
    p.title AS product_title,
    pv.title AS variant_title,
    pv.sku
  FROM inventory_movements im
  INNER JOIN product_variants pv ON pv.id = im.variant_id
  INNER JOIN products p ON p.id = pv.product_id
  WHERE im.store_id = $1
    AND ($2::uuid IS NULL OR im.variant_id = $2)
    AND ($3::uuid IS NULL OR im.order_id = $3)
    AND ($4::text IS NULL OR im.movement_type = $4)
  ORDER BY im.created_at DESC
  LIMIT $5 OFFSET $6
`;

const LIST_MOVEMENTS_COUNT_QUERY = `
  SELECT COUNT(*)::text AS total
  FROM inventory_movements im
  WHERE im.store_id = $1
    AND ($2::uuid IS NULL OR im.variant_id = $2)
    AND ($3::uuid IS NULL OR im.order_id = $3)
    AND ($4::text IS NULL OR im.movement_type = $4)
`;

const LIST_RESERVATIONS_ROWS_QUERY = `
  SELECT
    ir.id,
    ir.store_id,
    ir.order_id,
    ir.variant_id,
    ir.quantity,
    ir.status,
    ir.reserved_at,
    ir.expires_at,
    ir.released_at,
    ir.consumed_at,
    ir.release_reason,
    ir.metadata,
    ir.updated_at,
    pv.product_id,
    p.title AS product_title,
    pv.title AS variant_title,
    pv.sku
  FROM inventory_reservations ir
  INNER JOIN product_variants pv ON pv.id = ir.variant_id
  INNER JOIN products p ON p.id = pv.product_id
  WHERE ir.store_id = $1
    AND ($2::text IS NULL OR ir.status = $2)
    AND ($3::uuid IS NULL OR ir.variant_id = $3)
    AND ($4::uuid IS NULL OR ir.order_id = $4)
  ORDER BY ir.updated_at DESC
  LIMIT $5 OFFSET $6
`;

const LIST_RESERVATIONS_COUNT_QUERY = `
  SELECT COUNT(*)::text AS total
  FROM inventory_reservations ir
  WHERE ir.store_id = $1
    AND ($2::text IS NULL OR ir.status = $2)
    AND ($3::uuid IS NULL OR ir.variant_id = $3)
    AND ($4::uuid IS NULL OR ir.order_id = $4)
`;

@Injectable()
export class InventoryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async withTransaction<T>(callback: (db: Queryable) => Promise<T>): Promise<T> {
    const client = await this.databaseService.db.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async releaseExpiredReservations(db: Queryable, storeId: string): Promise<number> {
    const result = await db.query(
      `
        UPDATE inventory_reservations
        SET status = 'released',
            released_at = NOW(),
            release_reason = 'expired',
            updated_at = NOW()
        WHERE store_id = $1
          AND status = 'reserved'
          AND expires_at <= NOW()
      `,
      [storeId],
    );
    return result.rowCount ?? 0;
  }

  async reserveVariant(
    db: Queryable,
    input: {
      storeId: string;
      orderId: string;
      variantId: string;
      quantity: number;
      expiresAt: Date;
      metadata?: Record<string, unknown>;
    },
  ): Promise<boolean> {
    const variantStock = await this.findLockedVariantStock(db, input.storeId, input.variantId);
    if (variantStock === null) {
      return false;
    }

    const reservedQuantity = await this.sumActiveReservedQuantity(
      db,
      input.storeId,
      input.variantId,
    );
    const availableQuantity = variantStock - reservedQuantity;

    if (availableQuantity < input.quantity) {
      return false;
    }

    const insertResult = await this.upsertReservation(db, input);

    return (insertResult.rowCount ?? 0) > 0;
  }

  async consumeReservation(
    db: Queryable,
    input: {
      storeId: string;
      orderId: string;
      variantId: string;
      quantity: number;
    },
  ): Promise<boolean> {
    const result = await db.query(
      `
        UPDATE inventory_reservations
        SET status = 'consumed',
            consumed_at = NOW(),
            updated_at = NOW()
        WHERE store_id = $1
          AND order_id = $2
          AND variant_id = $3
          AND status = 'reserved'
          AND expires_at > NOW()
          AND quantity = $4
      `,
      [input.storeId, input.orderId, input.variantId, input.quantity],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async releaseOrderReservations(
    db: Queryable,
    input: {
      storeId: string;
      orderId: string;
      reason: string;
    },
  ): Promise<number> {
    const result = await db.query(
      `
        UPDATE inventory_reservations
        SET status = 'released',
            released_at = NOW(),
            release_reason = $3,
            updated_at = NOW()
        WHERE store_id = $1
          AND order_id = $2
          AND status = 'reserved'
      `,
      [input.storeId, input.orderId, input.reason],
    );

    return result.rowCount ?? 0;
  }

  async decreaseVariantStock(
    db: Queryable,
    input: {
      storeId: string;
      variantId: string;
      quantity: number;
    },
  ): Promise<VariantStockChangeRecord | null> {
    const result = await db.query<VariantStockChangeRecord>(
      `
        UPDATE product_variants
        SET stock_quantity = stock_quantity - $3,
            updated_at = NOW()
        WHERE store_id = $1
          AND id = $2
          AND stock_quantity >= $3
        RETURNING
          id AS variant_id,
          product_id,
          sku,
          low_stock_threshold,
          stock_quantity + $3 AS previous_stock_quantity,
          stock_quantity AS current_stock_quantity
      `,
      [input.storeId, input.variantId, input.quantity],
    );
    return result.rows[0] ?? null;
  }

  async increaseVariantStock(
    db: Queryable,
    input: {
      storeId: string;
      variantId: string;
      quantity: number;
    },
  ): Promise<VariantStockChangeRecord | null> {
    const result = await db.query<VariantStockChangeRecord>(
      `
        UPDATE product_variants
        SET stock_quantity = stock_quantity + $3,
            updated_at = NOW()
        WHERE store_id = $1
          AND id = $2
        RETURNING
          id AS variant_id,
          product_id,
          sku,
          low_stock_threshold,
          stock_quantity - $3 AS previous_stock_quantity,
          stock_quantity AS current_stock_quantity
      `,
      [input.storeId, input.variantId, input.quantity],
    );
    return result.rows[0] ?? null;
  }

  async updateVariantLowStockThreshold(
    db: Queryable,
    input: {
      storeId: string;
      variantId: string;
      lowStockThreshold: number;
    },
  ): Promise<VariantInventorySnapshotRecord | null> {
    await db.query(
      `
        UPDATE product_variants
        SET low_stock_threshold = $3,
            updated_at = NOW()
        WHERE store_id = $1
          AND id = $2
      `,
      [input.storeId, input.variantId, input.lowStockThreshold],
    );

    return this.findVariantInventorySnapshot(db, input.storeId, input.variantId);
  }

  async createMovement(
    db: Queryable,
    input: {
      storeId: string;
      variantId: string;
      orderId: string | null;
      movementType: InventoryMovementType;
      qtyDelta: number;
      note: string | null;
      metadata?: Record<string, unknown>;
      createdBy: string | null;
    },
  ): Promise<void> {
    await db.query(
      `
        INSERT INTO inventory_movements (
          id,
          store_id,
          variant_id,
          order_id,
          movement_type,
          qty_delta,
          note,
          metadata,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
      `,
      [
        uuidv4(),
        input.storeId,
        input.variantId,
        input.orderId,
        input.movementType,
        input.qtyDelta,
        input.note,
        JSON.stringify(input.metadata ?? {}),
        input.createdBy,
      ],
    );
  }

  async findVariantInventorySnapshot(
    db: Queryable,
    storeId: string,
    variantId: string,
  ): Promise<VariantInventorySnapshotRecord | null> {
    const result = await db.query<VariantInventorySnapshotRecord>(
      `
        SELECT
          pv.id AS variant_id,
          pv.product_id,
          pv.sku,
          p.title AS product_title,
          pv.title AS variant_title,
          pv.stock_quantity,
          pv.low_stock_threshold,
          COALESCE(active.reserved_quantity, 0)::int AS reserved_quantity,
          GREATEST(pv.stock_quantity - COALESCE(active.reserved_quantity, 0)::int, 0) AS available_quantity
        FROM product_variants pv
        INNER JOIN products p ON p.id = pv.product_id
        LEFT JOIN (
          SELECT variant_id, SUM(quantity)::int AS reserved_quantity
          FROM inventory_reservations
          WHERE store_id = $1
            AND status = 'reserved'
            AND expires_at > NOW()
          GROUP BY variant_id
        ) active ON active.variant_id = pv.id
        WHERE pv.store_id = $1
          AND pv.id = $2
        LIMIT 1
      `,
      [storeId, variantId],
    );

    return result.rows[0] ?? null;
  }

  async findVariantAvailableQuantity(storeId: string, variantId: string): Promise<number | null> {
    const snapshot = await this.findVariantInventorySnapshot(
      this.databaseService.db,
      storeId,
      variantId,
    );
    return snapshot ? snapshot.available_quantity : null;
  }

  async listMovements(input: {
    storeId: string;
    variantId?: string;
    orderId?: string;
    movementType?: InventoryMovementType;
    limit: number;
    offset: number;
  }): Promise<{ rows: InventoryMovementRecord[]; total: number }> {
    const rowsResult = await this.databaseService.db.query<InventoryMovementRecord>(
      LIST_MOVEMENTS_ROWS_QUERY,
      [
        input.storeId,
        input.variantId ?? null,
        input.orderId ?? null,
        input.movementType ?? null,
        input.limit,
        input.offset,
      ],
    );

    const countResult = await this.databaseService.db.query<{ total: string }>(
      LIST_MOVEMENTS_COUNT_QUERY,
      [input.storeId, input.variantId ?? null, input.orderId ?? null, input.movementType ?? null],
    );

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0]?.total ?? '0'),
    };
  }

  async listReservations(input: {
    storeId: string;
    status?: InventoryReservationStatus;
    variantId?: string;
    orderId?: string;
    limit: number;
    offset: number;
  }): Promise<{ rows: InventoryReservationRecord[]; total: number }> {
    const rowsResult = await this.databaseService.db.query<InventoryReservationRecord>(
      LIST_RESERVATIONS_ROWS_QUERY,
      [
        input.storeId,
        input.status ?? null,
        input.variantId ?? null,
        input.orderId ?? null,
        input.limit,
        input.offset,
      ],
    );

    const countResult = await this.databaseService.db.query<{ total: string }>(
      LIST_RESERVATIONS_COUNT_QUERY,
      [input.storeId, input.status ?? null, input.variantId ?? null, input.orderId ?? null],
    );

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0]?.total ?? '0'),
    };
  }

  async listLowStockVariants(storeId: string): Promise<VariantInventorySnapshotRecord[]> {
    const result = await this.databaseService.db.query<VariantInventorySnapshotRecord>(
      `
        SELECT
          pv.id AS variant_id,
          pv.product_id,
          pv.sku,
          p.title AS product_title,
          pv.title AS variant_title,
          pv.stock_quantity,
          pv.low_stock_threshold,
          COALESCE(active.reserved_quantity, 0)::int AS reserved_quantity,
          GREATEST(pv.stock_quantity - COALESCE(active.reserved_quantity, 0)::int, 0) AS available_quantity
        FROM product_variants pv
        INNER JOIN products p ON p.id = pv.product_id
        LEFT JOIN (
          SELECT variant_id, SUM(quantity)::int AS reserved_quantity
          FROM inventory_reservations
          WHERE store_id = $1
            AND status = 'reserved'
            AND expires_at > NOW()
          GROUP BY variant_id
        ) active ON active.variant_id = pv.id
        WHERE pv.store_id = $1
          AND pv.low_stock_threshold > 0
          AND pv.stock_quantity <= pv.low_stock_threshold
        ORDER BY pv.stock_quantity ASC, pv.updated_at DESC
      `,
      [storeId],
    );

    return result.rows;
  }

  private async findLockedVariantStock(
    db: Queryable,
    storeId: string,
    variantId: string,
  ): Promise<number | null> {
    const result = await db.query<{ stock_quantity: number }>(
      `
        SELECT stock_quantity
        FROM product_variants
        WHERE store_id = $1
          AND id = $2
        LIMIT 1
        FOR UPDATE
      `,
      [storeId, variantId],
    );
    return result.rows[0]?.stock_quantity ?? null;
  }

  private async sumActiveReservedQuantity(
    db: Queryable,
    storeId: string,
    variantId: string,
  ): Promise<number> {
    const result = await db.query<{ reserved_qty: string }>(
      `
        SELECT COALESCE(SUM(quantity), 0)::text AS reserved_qty
        FROM inventory_reservations
        WHERE store_id = $1
          AND variant_id = $2
          AND status = 'reserved'
          AND expires_at > NOW()
      `,
      [storeId, variantId],
    );

    return Number(result.rows[0]?.reserved_qty ?? '0');
  }

  private async upsertReservation(
    db: Queryable,
    input: {
      storeId: string;
      orderId: string;
      variantId: string;
      quantity: number;
      expiresAt: Date;
      metadata?: Record<string, unknown>;
    },
  ): Promise<{ rowCount: number | null }> {
    return db.query(
      `
        INSERT INTO inventory_reservations (
          id,
          store_id,
          order_id,
          variant_id,
          quantity,
          status,
          reserved_at,
          expires_at,
          metadata,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, 'reserved', NOW(), $6, $7::jsonb, NOW())
        ON CONFLICT (store_id, order_id, variant_id)
        DO UPDATE SET
          quantity = EXCLUDED.quantity,
          status = 'reserved',
          reserved_at = NOW(),
          expires_at = EXCLUDED.expires_at,
          released_at = NULL,
          consumed_at = NULL,
          release_reason = NULL,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
        WHERE inventory_reservations.status <> 'consumed'
      `,
      [
        uuidv4(),
        input.storeId,
        input.orderId,
        input.variantId,
        input.quantity,
        input.expiresAt,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
  }
}
