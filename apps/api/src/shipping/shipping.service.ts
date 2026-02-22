import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import type { RequestContextData } from '../common/utils/request-context.util';
import type { CreateShippingZoneDto } from './dto/create-shipping-zone.dto';
import type { ListShippingZonesQueryDto } from './dto/list-shipping-zones-query.dto';
import type { UpdateShippingZoneDto } from './dto/update-shipping-zone.dto';
import { ShippingRepository, type ShippingZoneRecord } from './shipping.repository';

export interface ShippingZoneResponse {
  id: string;
  storeId: string;
  name: string;
  city: string | null;
  area: string | null;
  fee: number;
  isActive: boolean;
}

@Injectable()
export class ShippingService {
  constructor(
    private readonly shippingRepository: ShippingRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(
    currentUser: AuthUser,
    input: CreateShippingZoneDto,
    context: RequestContextData,
  ): Promise<ShippingZoneResponse> {
    const zone = await this.shippingRepository.create({
      storeId: currentUser.storeId,
      name: input.name.trim(),
      city: input.city?.trim() ?? null,
      area: input.area?.trim() ?? null,
      fee: input.fee,
      isActive: input.isActive ?? true,
    });

    await this.log('shipping.zone_created', currentUser, zone.id, context);
    return this.toResponse(zone);
  }

  async list(currentUser: AuthUser, query: ListShippingZonesQueryDto): Promise<ShippingZoneResponse[]> {
    const rows = await this.shippingRepository.list(currentUser.storeId, query.q?.trim());
    return rows.map((row) => this.toResponse(row));
  }

  async update(
    currentUser: AuthUser,
    zoneId: string,
    input: UpdateShippingZoneDto,
    context: RequestContextData,
  ): Promise<ShippingZoneResponse> {
    const existing = await this.shippingRepository.findById(currentUser.storeId, zoneId);
    if (!existing) {
      throw new NotFoundException('Shipping zone not found');
    }

    const updated = await this.shippingRepository.update(
      this.buildUpdatePayload(currentUser.storeId, zoneId, input, existing),
    );

    if (!updated) {
      throw new NotFoundException('Shipping zone not found');
    }

    await this.log('shipping.zone_updated', currentUser, zoneId, context);
    return this.toResponse(updated);
  }

  async remove(currentUser: AuthUser, zoneId: string, context: RequestContextData): Promise<void> {
    const deleted = await this.shippingRepository.delete(currentUser.storeId, zoneId);
    if (!deleted) {
      throw new NotFoundException('Shipping zone not found');
    }
    await this.log('shipping.zone_deleted', currentUser, zoneId, context);
  }

  private async log(
    action: string,
    currentUser: AuthUser,
    zoneId: string,
    context: RequestContextData,
  ): Promise<void> {
    await this.auditService.log({
      action,
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'shipping_zone',
      targetId: zoneId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: context.requestId ? { requestId: context.requestId } : {},
    });
  }

  private toResponse(row: ShippingZoneRecord): ShippingZoneResponse {
    return {
      id: row.id,
      storeId: row.store_id,
      name: row.name,
      city: row.city,
      area: row.area,
      fee: Number(row.fee),
      isActive: row.is_active,
    };
  }

  private buildUpdatePayload(
    storeId: string,
    zoneId: string,
    input: UpdateShippingZoneDto,
    existing: ShippingZoneRecord,
  ): {
    storeId: string;
    zoneId: string;
    name: string;
    city: string | null;
    area: string | null;
    fee: number;
    isActive: boolean;
  } {
    return {
      storeId,
      zoneId,
      name: input.name?.trim() ?? existing.name,
      city: input.city?.trim() ?? existing.city,
      area: input.area?.trim() ?? existing.area,
      fee: input.fee ?? Number(existing.fee),
      isActive: input.isActive ?? existing.is_active,
    };
  }
}
