import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import type { RequestContextData } from '../common/utils/request-context.util';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import type { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { StoresRepository, type StoreSettingsRecord } from './stores.repository';

export interface StoreSettingsResponse {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  currencyCode: string;
  timezone: string;
  shippingPolicy: string | null;
  returnPolicy: string | null;
  privacyPolicy: string | null;
  termsAndConditions: string | null;
}

@Injectable()
export class StoresService {
  constructor(
    private readonly storesRepository: StoresRepository,
    private readonly auditService: AuditService,
  ) {}

  async getSettings(currentUser: AuthUser): Promise<StoreSettingsResponse> {
    const store = await this.storesRepository.findById(currentUser.storeId);
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return this.toResponse(store);
  }

  async updateSettings(
    currentUser: AuthUser,
    input: UpdateStoreSettingsDto,
    context: RequestContextData,
  ): Promise<StoreSettingsResponse> {
    const current = await this.storesRepository.findById(currentUser.storeId);
    if (!current) {
      throw new NotFoundException('Store not found');
    }

    const payload = this.buildUpdatePayload(current, input);
    const updated = await this.storesRepository.updateSettings(payload);
    await this.logSettingsUpdate(currentUser, context);

    return this.toResponse(updated);
  }

  private buildUpdatePayload(current: StoreSettingsRecord, input: UpdateStoreSettingsDto) {
    return {
      storeId: current.id,
      name: input.name?.trim() ?? current.name,
      currencyCode: input.currencyCode ?? current.currency_code,
      timezone: input.timezone?.trim() ?? current.timezone,
      logoUrl: input.logoUrl ?? current.logo_url,
      phone: input.phone ?? current.phone,
      address: input.address ?? current.address,
      shippingPolicy: input.shippingPolicy ?? current.shipping_policy,
      returnPolicy: input.returnPolicy ?? current.return_policy,
      privacyPolicy: input.privacyPolicy ?? current.privacy_policy,
      termsOfService: input.termsAndConditions ?? current.terms_of_service,
    };
  }

  private async logSettingsUpdate(
    currentUser: AuthUser,
    context: RequestContextData,
  ): Promise<void> {
    await this.auditService.log({
      action: 'store.settings_updated',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'store',
      targetId: currentUser.storeId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: context.requestId ? { requestId: context.requestId } : {},
    });
  }

  private toResponse(store: StoreSettingsRecord): StoreSettingsResponse {
    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      logoUrl: store.logo_url,
      phone: store.phone,
      address: store.address,
      currencyCode: store.currency_code,
      timezone: store.timezone,
      shippingPolicy: store.shipping_policy,
      returnPolicy: store.return_policy,
      privacyPolicy: store.privacy_policy,
      termsAndConditions: store.terms_of_service,
    };
  }
}
