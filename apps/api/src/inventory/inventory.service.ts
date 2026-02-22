import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import type { RequestContextData } from '../common/utils/request-context.util';
import { OutboxService } from '../messaging/outbox.service';
import type {
  InventoryMovementType,
  InventoryReservationStatus,
} from './constants/inventory.constants';
import type { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import type { ListInventoryMovementsQueryDto } from './dto/list-inventory-movements-query.dto';
import type { ListInventoryReservationsQueryDto } from './dto/list-inventory-reservations-query.dto';
import { InventoryRepository, type Queryable } from './inventory.repository';

export interface InventoryOrderItemInput {
  variantId: string;
  quantity: number;
  sku: string;
}

export interface LowStockSignal {
  storeId: string;
  productId: string;
  variantId: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface InventoryMovementResponse {
  id: string;
  variantId: string;
  orderId: string | null;
  movementType: InventoryMovementType;
  qtyDelta: number;
  note: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: Date;
  productId: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
}

export interface InventoryReservationResponse {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  status: InventoryReservationStatus;
  reservedAt: Date;
  expiresAt: Date;
  releasedAt: Date | null;
  consumedAt: Date | null;
  releaseReason: string | null;
  metadata: Record<string, unknown>;
  updatedAt: Date;
  productId: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
}

export interface InventoryVariantSnapshotResponse {
  variantId: string;
  productId: string;
  sku: string;
  productTitle: string;
  variantTitle: string;
  stockQuantity: number;
  lowStockThreshold: number;
  reservedQuantity: number;
  availableQuantity: number;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly outboxService: OutboxService,
    private readonly auditService: AuditService,
  ) {}

  async releaseExpiredReservations(storeId: string): Promise<number> {
    return this.inventoryRepository.withTransaction((db) =>
      this.releaseExpiredReservationsInTransaction(db, storeId),
    );
  }

  async releaseExpiredReservationsInTransaction(db: Queryable, storeId: string): Promise<number> {
    return this.inventoryRepository.releaseExpiredReservations(db, storeId);
  }

  async getAvailableStock(storeId: string, variantId: string): Promise<number | null> {
    return this.inventoryRepository.findVariantAvailableQuantity(storeId, variantId);
  }

  async reserveOrderItems(
    db: Queryable,
    input: {
      storeId: string;
      orderId: string;
      expiresAt: Date;
      items: InventoryOrderItemInput[];
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    for (const item of input.items) {
      const reserveInput: {
        storeId: string;
        orderId: string;
        variantId: string;
        quantity: number;
        expiresAt: Date;
        metadata?: Record<string, unknown>;
      } = {
        storeId: input.storeId,
        orderId: input.orderId,
        variantId: item.variantId,
        quantity: item.quantity,
        expiresAt: input.expiresAt,
      };

      if (input.metadata) {
        reserveInput.metadata = input.metadata;
      }

      const reserved = await this.inventoryRepository.reserveVariant(db, reserveInput);

      if (!reserved) {
        throw new UnprocessableEntityException(`Insufficient reservable stock for SKU ${item.sku}`);
      }
    }
  }

  async confirmReservedOrderItems(
    db: Queryable,
    input: {
      storeId: string;
      orderId: string;
      items: InventoryOrderItemInput[];
      actorId: string | null;
    },
  ): Promise<LowStockSignal[]> {
    const lowStockSignals: LowStockSignal[] = [];

    for (const item of input.items) {
      const consumed = await this.inventoryRepository.consumeReservation(db, {
        storeId: input.storeId,
        orderId: input.orderId,
        variantId: item.variantId,
        quantity: item.quantity,
      });

      if (!consumed) {
        throw new UnprocessableEntityException(
          `Reservation missing or expired for SKU ${item.sku}`,
        );
      }

      const stockChange = await this.inventoryRepository.decreaseVariantStock(db, {
        storeId: input.storeId,
        variantId: item.variantId,
        quantity: item.quantity,
      });

      if (!stockChange) {
        throw new UnprocessableEntityException(`Insufficient stock for SKU ${item.sku}`);
      }

      await this.inventoryRepository.createMovement(db, {
        storeId: input.storeId,
        variantId: item.variantId,
        orderId: input.orderId,
        movementType: 'sale',
        qtyDelta: -item.quantity,
        note: 'Stock deducted on order confirmation',
        metadata: { source: 'order.status.confirmed' },
        createdBy: input.actorId,
      });

      const signal = this.buildLowStockSignal(input.storeId, stockChange);
      if (signal) {
        lowStockSignals.push(signal);
      }
    }

    return lowStockSignals;
  }

  async releaseOrderReservations(
    db: Queryable,
    input: { storeId: string; orderId: string; reason: string },
  ): Promise<void> {
    await this.inventoryRepository.releaseOrderReservations(db, input);
  }

  async restockOrderItems(
    db: Queryable,
    input: {
      storeId: string;
      orderId: string;
      items: InventoryOrderItemInput[];
      actorId: string | null;
      note: string;
      movementType?: InventoryMovementType;
    },
  ): Promise<void> {
    const movementType = input.movementType ?? 'return';

    for (const item of input.items) {
      const stockChange = await this.inventoryRepository.increaseVariantStock(db, {
        storeId: input.storeId,
        variantId: item.variantId,
        quantity: item.quantity,
      });

      if (!stockChange) {
        throw new NotFoundException(`Variant not found for SKU ${item.sku}`);
      }

      await this.inventoryRepository.createMovement(db, {
        storeId: input.storeId,
        variantId: item.variantId,
        orderId: input.orderId,
        movementType,
        qtyDelta: item.quantity,
        note: input.note,
        metadata: { source: 'order.status.restock' },
        createdBy: input.actorId,
      });
    }
  }

  async adjustVariantStock(
    currentUser: AuthUser,
    variantId: string,
    input: AdjustInventoryDto,
    context: RequestContextData,
  ): Promise<InventoryVariantSnapshotResponse> {
    const quantityDelta = input.quantityDelta;
    if (quantityDelta === 0) {
      throw new BadRequestException('quantityDelta cannot be zero');
    }

    const result = await this.executeVariantAdjustment(
      currentUser,
      variantId,
      quantityDelta,
      input.note?.trim() ?? null,
    );

    if (result.signal) {
      await this.publishLowStockAlerts([result.signal]);
    }

    await this.logInventoryAdjustment(currentUser, variantId, quantityDelta, input.note, context);

    return this.mapVariantSnapshot(result.snapshot);
  }

  async updateLowStockThreshold(
    currentUser: AuthUser,
    variantId: string,
    lowStockThreshold: number,
    context: RequestContextData,
  ): Promise<InventoryVariantSnapshotResponse> {
    const snapshot = await this.inventoryRepository.withTransaction(async (db) => {
      const updated = await this.inventoryRepository.updateVariantLowStockThreshold(db, {
        storeId: currentUser.storeId,
        variantId,
        lowStockThreshold,
      });

      if (!updated) {
        throw new NotFoundException('Variant not found');
      }

      return updated;
    });

    await this.auditService.log({
      action: 'inventory.low_stock_threshold_updated',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'product_variant',
      targetId: variantId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        lowStockThreshold,
        requestId: context.requestId,
      },
    });

    if (
      snapshot.low_stock_threshold > 0 &&
      snapshot.stock_quantity <= snapshot.low_stock_threshold
    ) {
      await this.publishLowStockAlerts([
        {
          storeId: currentUser.storeId,
          productId: snapshot.product_id,
          variantId: snapshot.variant_id,
          sku: snapshot.sku,
          stockQuantity: snapshot.stock_quantity,
          lowStockThreshold: snapshot.low_stock_threshold,
        },
      ]);
    }

    return this.mapVariantSnapshot(snapshot);
  }

  async listMovements(currentUser: AuthUser, query: ListInventoryMovementsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const data = await this.inventoryRepository.listMovements({
      storeId: currentUser.storeId,
      ...(query.variantId ? { variantId: query.variantId } : {}),
      ...(query.orderId ? { orderId: query.orderId } : {}),
      ...(query.movementType ? { movementType: query.movementType } : {}),
      limit,
      offset: (page - 1) * limit,
    });

    return {
      items: data.rows.map((row) => this.mapMovement(row)),
      total: data.total,
      page,
      limit,
    };
  }

  async listReservations(currentUser: AuthUser, query: ListInventoryReservationsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const data = await this.inventoryRepository.listReservations({
      storeId: currentUser.storeId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.variantId ? { variantId: query.variantId } : {}),
      ...(query.orderId ? { orderId: query.orderId } : {}),
      limit,
      offset: (page - 1) * limit,
    });

    return {
      items: data.rows.map((row) => this.mapReservation(row)),
      total: data.total,
      page,
      limit,
    };
  }

  async listLowStockAlerts(currentUser: AuthUser): Promise<InventoryVariantSnapshotResponse[]> {
    const rows = await this.inventoryRepository.listLowStockVariants(currentUser.storeId);
    return rows.map((row) => this.mapVariantSnapshot(row));
  }

  async publishLowStockAlerts(signals: LowStockSignal[]): Promise<void> {
    const dedupedSignals = new Map<string, LowStockSignal>();

    for (const signal of signals) {
      dedupedSignals.set(`${signal.storeId}:${signal.variantId}`, signal);
    }

    for (const signal of dedupedSignals.values()) {
      await this.outboxService.enqueue({
        aggregateType: 'inventory',
        aggregateId: signal.variantId,
        eventType: 'inventory.low_stock',
        payload: {
          storeId: signal.storeId,
          productId: signal.productId,
          variantId: signal.variantId,
          sku: signal.sku,
          stockQuantity: signal.stockQuantity,
          lowStockThreshold: signal.lowStockThreshold,
          observedAt: new Date().toISOString(),
        },
      });
    }
  }

  private async executeVariantAdjustment(
    currentUser: AuthUser,
    variantId: string,
    quantityDelta: number,
    note: string | null,
  ): Promise<{
    snapshot: {
      variant_id: string;
      product_id: string;
      sku: string;
      product_title: string;
      variant_title: string;
      stock_quantity: number;
      low_stock_threshold: number;
      reserved_quantity: number;
      available_quantity: number;
    };
    signal: LowStockSignal | null;
  }> {
    return this.inventoryRepository.withTransaction(async (db) => {
      await this.requireVariantSnapshot(db, currentUser.storeId, variantId);
      const movementType: InventoryMovementType = quantityDelta > 0 ? 'restock' : 'adjustment';
      const stockChange = await this.applyVariantStockChange(
        db,
        currentUser.storeId,
        variantId,
        quantityDelta,
      );

      await this.inventoryRepository.createMovement(db, {
        storeId: currentUser.storeId,
        variantId,
        orderId: null,
        movementType,
        qtyDelta: quantityDelta,
        note,
        metadata: { source: 'inventory.adjustment' },
        createdBy: currentUser.id,
      });
      const snapshotAfter = await this.requireVariantSnapshot(db, currentUser.storeId, variantId);

      return {
        snapshot: snapshotAfter,
        signal: this.buildLowStockSignal(currentUser.storeId, stockChange),
      };
    });
  }

  private async requireVariantSnapshot(
    db: Queryable,
    storeId: string,
    variantId: string,
  ): Promise<{
    variant_id: string;
    product_id: string;
    sku: string;
    product_title: string;
    variant_title: string;
    stock_quantity: number;
    low_stock_threshold: number;
    reserved_quantity: number;
    available_quantity: number;
  }> {
    const snapshot = await this.inventoryRepository.findVariantInventorySnapshot(
      db,
      storeId,
      variantId,
    );
    if (!snapshot) {
      throw new NotFoundException('Variant not found');
    }
    return snapshot;
  }

  private async applyVariantStockChange(
    db: Queryable,
    storeId: string,
    variantId: string,
    quantityDelta: number,
  ): Promise<{
    variant_id: string;
    product_id: string;
    sku: string;
    low_stock_threshold: number;
    previous_stock_quantity: number;
    current_stock_quantity: number;
  }> {
    const absoluteQuantity = Math.abs(quantityDelta);
    const stockChange =
      quantityDelta > 0
        ? await this.inventoryRepository.increaseVariantStock(db, {
            storeId,
            variantId,
            quantity: absoluteQuantity,
          })
        : await this.inventoryRepository.decreaseVariantStock(db, {
            storeId,
            variantId,
            quantity: absoluteQuantity,
          });

    if (!stockChange) {
      throw new UnprocessableEntityException('Insufficient stock for adjustment');
    }

    return stockChange;
  }

  private async logInventoryAdjustment(
    currentUser: AuthUser,
    variantId: string,
    quantityDelta: number,
    note: string | undefined,
    context: RequestContextData,
  ): Promise<void> {
    await this.auditService.log({
      action: 'inventory.adjusted',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'product_variant',
      targetId: variantId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        quantityDelta,
        note: note?.trim() ?? null,
        requestId: context.requestId,
      },
    });
  }

  private buildLowStockSignal(
    storeId: string,
    stockChange: {
      variant_id: string;
      product_id: string;
      sku: string;
      low_stock_threshold: number;
      previous_stock_quantity: number;
      current_stock_quantity: number;
    },
  ): LowStockSignal | null {
    const threshold = stockChange.low_stock_threshold;
    if (threshold <= 0) {
      return null;
    }

    const crossedThresholdDownward =
      stockChange.previous_stock_quantity > threshold &&
      stockChange.current_stock_quantity <= threshold;

    if (!crossedThresholdDownward) {
      return null;
    }

    return {
      storeId,
      productId: stockChange.product_id,
      variantId: stockChange.variant_id,
      sku: stockChange.sku,
      stockQuantity: stockChange.current_stock_quantity,
      lowStockThreshold: threshold,
    };
  }

  private mapMovement(row: {
    id: string;
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
  }): InventoryMovementResponse {
    return {
      id: row.id,
      variantId: row.variant_id,
      orderId: row.order_id,
      movementType: row.movement_type,
      qtyDelta: row.qty_delta,
      note: row.note,
      metadata: row.metadata ?? {},
      createdBy: row.created_by,
      createdAt: row.created_at,
      productId: row.product_id,
      productTitle: row.product_title,
      variantTitle: row.variant_title,
      sku: row.sku,
    };
  }

  private mapReservation(row: {
    id: string;
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
  }): InventoryReservationResponse {
    return {
      id: row.id,
      orderId: row.order_id,
      variantId: row.variant_id,
      quantity: row.quantity,
      status: row.status,
      reservedAt: row.reserved_at,
      expiresAt: row.expires_at,
      releasedAt: row.released_at,
      consumedAt: row.consumed_at,
      releaseReason: row.release_reason,
      metadata: row.metadata ?? {},
      updatedAt: row.updated_at,
      productId: row.product_id,
      productTitle: row.product_title,
      variantTitle: row.variant_title,
      sku: row.sku,
    };
  }

  private mapVariantSnapshot(row: {
    variant_id: string;
    product_id: string;
    sku: string;
    product_title: string;
    variant_title: string;
    stock_quantity: number;
    low_stock_threshold: number;
    reserved_quantity: number;
    available_quantity: number;
  }): InventoryVariantSnapshotResponse {
    return {
      variantId: row.variant_id,
      productId: row.product_id,
      sku: row.sku,
      productTitle: row.product_title,
      variantTitle: row.variant_title,
      stockQuantity: row.stock_quantity,
      lowStockThreshold: row.low_stock_threshold,
      reservedQuantity: row.reserved_quantity,
      availableQuantity: row.available_quantity,
    };
  }
}
