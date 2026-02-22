import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import type { OrderStatus } from './constants/order-status.constants';
import type { PaymentMethod } from './constants/payment.constants';

interface Queryable {
  query: <T = unknown>(
    queryText: string,
    values?: unknown[],
  ) => Promise<{ rows: T[]; rowCount: number | null }>;
}

export interface StoreVariantSnapshot {
  variant_id: string;
  product_id: string;
  product_status: string;
  product_title: string;
  sku: string;
  variant_title: string;
  price: string;
  stock_quantity: number;
  attributes: Record<string, string>;
}

export interface CartRecord {
  id: string;
  store_id: string;
  status: 'open' | 'checked_out' | 'abandoned';
  currency_code: string;
}

export interface CartItemSnapshot {
  cart_item_id: string;
  product_id: string;
  category_id: string | null;
  variant_id: string;
  quantity: number;
  unit_price: string;
  stock_quantity: number;
  product_title: string;
  sku: string;
  attributes: Record<string, string>;
}

export interface OrderRecord {
  id: string;
  store_id: string;
  customer_id: string | null;
  order_code: string;
  status: OrderStatus;
  subtotal: string;
  total: string;
  shipping_zone_id: string | null;
  shipping_fee: string;
  discount_total: string;
  coupon_code: string | null;
  currency_code: string;
  note: string | null;
  shipping_address: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  title: string;
  sku: string;
  unit_price: string;
  quantity: number;
  line_total: string;
  attributes: Record<string, string>;
}

export interface OrderStatusHistoryRecord {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  note: string | null;
  created_at: Date;
}

interface CreateOrderInput {
  id: string;
  storeId: string;
  customerId: string;
  orderCode: string;
  subtotal: number;
  total: number;
  shippingZoneId: string | null;
  shippingFee: number;
  discountTotal: number;
  couponCode: string | null;
  currencyCode: string;
  note: string | null;
  shippingAddress: Record<string, unknown>;
}

const ORDER_RETURNING_FIELDS =
  'id, store_id, customer_id, order_code, status, subtotal, total, shipping_zone_id, shipping_fee, discount_total, coupon_code, currency_code, note, shipping_address, created_at, updated_at';

const INSERT_ORDER_QUERY = `
  INSERT INTO orders (
    id,
    store_id,
    customer_id,
    order_code,
    status,
    subtotal,
    total,
    shipping_zone_id,
    shipping_fee,
    discount_total,
    coupon_code,
    currency_code,
    note,
    shipping_address
  ) VALUES ($1, $2, $3, $4, 'new', $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
  RETURNING ${ORDER_RETURNING_FIELDS}
`;

@Injectable()
export class OrdersRepository {
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

  async findVariantForStore(
    storeId: string,
    variantId: string,
  ): Promise<StoreVariantSnapshot | null> {
    const result = await this.databaseService.db.query<StoreVariantSnapshot>(
      `
        SELECT
          pv.id AS variant_id,
          pv.product_id,
          p.status AS product_status,
          p.title AS product_title,
          pv.sku,
          pv.title AS variant_title,
          pv.price,
          pv.stock_quantity,
          pv.attributes
        FROM product_variants pv
        INNER JOIN products p ON p.id = pv.product_id
        WHERE pv.store_id = $1
          AND pv.id = $2
        LIMIT 1
      `,
      [storeId, variantId],
    );

    return result.rows[0] ?? null;
  }

  async findOpenCartById(storeId: string, cartId: string): Promise<CartRecord | null> {
    const result = await this.databaseService.db.query<CartRecord>(
      `
        SELECT id, store_id, status, currency_code
        FROM carts
        WHERE store_id = $1
          AND id = $2
          AND status = 'open'
        LIMIT 1
      `,
      [storeId, cartId],
    );
    return result.rows[0] ?? null;
  }

  async createCart(storeId: string, currencyCode: string): Promise<CartRecord> {
    const result = await this.databaseService.db.query<CartRecord>(
      `
        INSERT INTO carts (id, store_id, status, currency_code)
        VALUES ($1, $2, 'open', $3)
        RETURNING id, store_id, status, currency_code
      `,
      [uuidv4(), storeId, currencyCode],
    );
    return result.rows[0] as CartRecord;
  }

  async addOrIncrementCartItem(input: {
    cartId: string;
    storeId: string;
    productId: string;
    variantId: string;
    quantity: number;
    unitPrice: number;
  }): Promise<void> {
    await this.databaseService.db.query(
      `
        INSERT INTO cart_items (
          id,
          cart_id,
          store_id,
          product_id,
          variant_id,
          quantity,
          unit_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (cart_id, variant_id)
        DO UPDATE SET
          quantity = cart_items.quantity + EXCLUDED.quantity,
          unit_price = EXCLUDED.unit_price,
          updated_at = NOW()
      `,
      [
        uuidv4(),
        input.cartId,
        input.storeId,
        input.productId,
        input.variantId,
        input.quantity,
        input.unitPrice,
      ],
    );

    await this.touchCart(input.cartId);
  }

  async listCartItems(storeId: string, cartId: string): Promise<CartItemSnapshot[]> {
    const result = await this.databaseService.db.query<CartItemSnapshot>(
      `
        SELECT
          ci.id AS cart_item_id,
          ci.product_id,
          p.category_id,
          ci.variant_id,
          ci.quantity,
          ci.unit_price,
          pv.stock_quantity,
          p.title AS product_title,
          pv.sku,
          pv.attributes
        FROM cart_items ci
        INNER JOIN product_variants pv ON pv.id = ci.variant_id
        INNER JOIN products p ON p.id = ci.product_id
        WHERE ci.store_id = $1
          AND ci.cart_id = $2
        ORDER BY ci.created_at ASC
      `,
      [storeId, cartId],
    );

    return result.rows;
  }

  async updateCartItemQuantity(input: {
    storeId: string;
    cartId: string;
    variantId: string;
    quantity: number;
  }): Promise<boolean> {
    const result = await this.databaseService.db.query(
      `
        UPDATE cart_items
        SET quantity = $4,
            updated_at = NOW()
        WHERE store_id = $1
          AND cart_id = $2
          AND variant_id = $3
      `,
      [input.storeId, input.cartId, input.variantId, input.quantity],
    );

    if ((result.rowCount ?? 0) > 0) {
      await this.touchCart(input.cartId);
      return true;
    }

    return false;
  }

  async removeCartItem(input: {
    storeId: string;
    cartId: string;
    variantId: string;
  }): Promise<boolean> {
    const result = await this.databaseService.db.query(
      `
        DELETE FROM cart_items
        WHERE store_id = $1
          AND cart_id = $2
          AND variant_id = $3
      `,
      [input.storeId, input.cartId, input.variantId],
    );

    if ((result.rowCount ?? 0) > 0) {
      await this.touchCart(input.cartId);
      return true;
    }

    return false;
  }

  async findOrCreateCustomer(
    db: Queryable,
    input: { storeId: string; fullName: string; phone: string; email: string | null },
  ): Promise<string> {
    const existing = await db.query<{ id: string }>(
      `
        SELECT id
        FROM customers
        WHERE store_id = $1
          AND phone = $2
        LIMIT 1
      `,
      [input.storeId, input.phone],
    );

    if (existing.rows[0]?.id) {
      return existing.rows[0].id;
    }

    const created = await db.query<{ id: string }>(
      `
        INSERT INTO customers (id, store_id, full_name, phone, email)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [uuidv4(), input.storeId, input.fullName, input.phone, input.email],
    );
    return created.rows[0]!.id;
  }

  async insertCustomerAddress(
    db: Queryable,
    input: {
      storeId: string;
      customerId: string;
      addressLine: string;
      city: string | null;
      area: string | null;
      notes: string | null;
    },
  ): Promise<void> {
    await db.query(
      `
        INSERT INTO customer_addresses (
          id,
          customer_id,
          store_id,
          address_line,
          city,
          area,
          notes,
          is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
      `,
      [
        uuidv4(),
        input.customerId,
        input.storeId,
        input.addressLine,
        input.city,
        input.area,
        input.notes,
      ],
    );
  }

  async createOrder(db: Queryable, input: CreateOrderInput): Promise<OrderRecord> {
    const result = await db.query<OrderRecord>(INSERT_ORDER_QUERY, [
      input.id,
      input.storeId,
      input.customerId,
      input.orderCode,
      input.subtotal,
      input.total,
      input.shippingZoneId,
      input.shippingFee,
      input.discountTotal,
      input.couponCode,
      input.currencyCode,
      input.note,
      JSON.stringify(input.shippingAddress),
    ]);
    return result.rows[0] as OrderRecord;
  }

  async insertOrderItem(
    db: Queryable,
    input: {
      orderId: string;
      storeId: string;
      productId: string;
      variantId: string;
      title: string;
      sku: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
      attributes: Record<string, string>;
    },
  ): Promise<void> {
    await db.query(
      `
        INSERT INTO order_items (
          id,
          order_id,
          store_id,
          product_id,
          variant_id,
          title,
          sku,
          unit_price,
          quantity,
          line_total,
          attributes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
      `,
      [
        uuidv4(),
        input.orderId,
        input.storeId,
        input.productId,
        input.variantId,
        input.title,
        input.sku,
        input.unitPrice,
        input.quantity,
        input.lineTotal,
        JSON.stringify(input.attributes),
      ],
    );
  }

  async createPayment(
    db: Queryable,
    input: { storeId: string; orderId: string; method: PaymentMethod; amount: number },
  ): Promise<void> {
    await db.query(
      `
        INSERT INTO payments (id, store_id, order_id, method, status, amount)
        VALUES ($1, $2, $3, $4, 'pending', $5)
      `,
      [uuidv4(), input.storeId, input.orderId, input.method, input.amount],
    );
  }

  async markCartCheckedOut(db: Queryable, cartId: string): Promise<void> {
    await db.query(
      `
        UPDATE carts
        SET status = 'checked_out',
            updated_at = NOW()
        WHERE id = $1
      `,
      [cartId],
    );
  }

  async insertOrderStatusHistory(
    db: Queryable,
    input: {
      storeId: string;
      orderId: string;
      oldStatus: string | null;
      newStatus: string;
      changedBy: string | null;
      note: string | null;
    },
  ): Promise<void> {
    await db.query(
      `
        INSERT INTO order_status_history (
          id,
          store_id,
          order_id,
          old_status,
          new_status,
          changed_by,
          note
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        uuidv4(),
        input.storeId,
        input.orderId,
        input.oldStatus,
        input.newStatus,
        input.changedBy,
        input.note,
      ],
    );
  }

  async findOrderByCode(storeId: string, orderCode: string): Promise<OrderRecord | null> {
    const result = await this.databaseService.db.query<OrderRecord>(
      `
        SELECT id, store_id, customer_id, order_code, status, subtotal, total, shipping_zone_id, shipping_fee, discount_total, coupon_code, currency_code, note, shipping_address, created_at, updated_at
        FROM orders
        WHERE store_id = $1
          AND order_code = $2
        LIMIT 1
      `,
      [storeId, orderCode],
    );
    return result.rows[0] ?? null;
  }

  async findCustomerPhoneByOrderId(orderId: string): Promise<string | null> {
    const result = await this.databaseService.db.query<{ phone: string }>(
      `
        SELECT c.phone
        FROM orders o
        LEFT JOIN customers c ON c.id = o.customer_id
        WHERE o.id = $1
        LIMIT 1
      `,
      [orderId],
    );

    return result.rows[0]?.phone ?? null;
  }

  async findOrderById(storeId: string, orderId: string): Promise<OrderRecord | null> {
    const result = await this.databaseService.db.query<OrderRecord>(
      `
        SELECT id, store_id, customer_id, order_code, status, subtotal, total, shipping_zone_id, shipping_fee, discount_total, coupon_code, currency_code, note, shipping_address, created_at, updated_at
        FROM orders
        WHERE store_id = $1
          AND id = $2
        LIMIT 1
      `,
      [storeId, orderId],
    );
    return result.rows[0] ?? null;
  }

  async listOrders(input: {
    storeId: string;
    status?: OrderStatus | undefined;
    q?: string | undefined;
    limit: number;
    offset: number;
  }): Promise<{ rows: OrderRecord[]; total: number }> {
    const rowsResult = await this.databaseService.db.query<OrderRecord>(
      `
        SELECT id, store_id, customer_id, order_code, status, subtotal, total, shipping_zone_id, shipping_fee, discount_total, coupon_code, currency_code, note, shipping_address, created_at, updated_at
        FROM orders
        WHERE store_id = $1
          AND ($2::text IS NULL OR status = $2)
          AND ($3::text IS NULL OR order_code ILIKE '%' || $3 || '%')
        ORDER BY created_at DESC
        LIMIT $4 OFFSET $5
      `,
      [input.storeId, input.status ?? null, input.q ?? null, input.limit, input.offset],
    );

    const countResult = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM orders
        WHERE store_id = $1
          AND ($2::text IS NULL OR status = $2)
          AND ($3::text IS NULL OR order_code ILIKE '%' || $3 || '%')
      `,
      [input.storeId, input.status ?? null, input.q ?? null],
    );

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0]?.total ?? '0'),
    };
  }

  async listOrderItems(orderId: string): Promise<OrderItemRecord[]> {
    const result = await this.databaseService.db.query<OrderItemRecord>(
      `
        SELECT id, order_id, product_id, variant_id, title, sku, unit_price, quantity, line_total, attributes
        FROM order_items
        WHERE order_id = $1
        ORDER BY created_at ASC
      `,
      [orderId],
    );
    return result.rows;
  }

  async listOrderStatusHistory(orderId: string): Promise<OrderStatusHistoryRecord[]> {
    const result = await this.databaseService.db.query<OrderStatusHistoryRecord>(
      `
        SELECT id, old_status, new_status, changed_by, note, created_at
        FROM order_status_history
        WHERE order_id = $1
        ORDER BY created_at ASC
      `,
      [orderId],
    );
    return result.rows;
  }

  async findPaymentByOrderId(orderId: string): Promise<{
    id: string;
    method: string;
    status: string;
    amount: string;
    receipt_url: string | null;
  } | null> {
    const result = await this.databaseService.db.query<{
      id: string;
      method: string;
      status: string;
      amount: string;
      receipt_url: string | null;
    }>(
      `
        SELECT id, method, status, amount, receipt_url
        FROM payments
        WHERE order_id = $1
        LIMIT 1
      `,
      [orderId],
    );
    return result.rows[0] ?? null;
  }

  async updateOrderStatus(
    db: Queryable,
    input: { orderId: string; storeId: string; nextStatus: OrderStatus },
  ): Promise<OrderRecord | null> {
    const result = await db.query<OrderRecord>(
      `
        UPDATE orders
        SET status = $3,
            updated_at = NOW()
        WHERE id = $1
          AND store_id = $2
        RETURNING id, store_id, customer_id, order_code, status, subtotal, total, shipping_zone_id, shipping_fee, discount_total, coupon_code, currency_code, note, shipping_address, created_at, updated_at
      `,
      [input.orderId, input.storeId, input.nextStatus],
    );
    return result.rows[0] ?? null;
  }

  async decreaseVariantStock(
    db: Queryable,
    input: { storeId: string; variantId: string; quantity: number },
  ): Promise<boolean> {
    const result = await db.query(
      `
        UPDATE product_variants
        SET stock_quantity = stock_quantity - $3,
            updated_at = NOW()
        WHERE store_id = $1
          AND id = $2
          AND stock_quantity >= $3
      `,
      [input.storeId, input.variantId, input.quantity],
    );
    return (result.rowCount ?? 0) > 0;
  }

  private async touchCart(cartId: string): Promise<void> {
    await this.databaseService.db.query(
      `
        UPDATE carts
        SET updated_at = NOW(),
            expires_at = NOW() + INTERVAL '7 days'
        WHERE id = $1
      `,
      [cartId],
    );
  }
}
