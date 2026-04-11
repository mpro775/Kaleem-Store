import { IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import {
  STOREFRONT_ANALYTICS_EVENT_NAMES,
  type StorefrontAnalyticsEventName,
} from '../constants/storefront-event.constants';

export class TrackStorefrontEventDto {
  @IsString()
  @IsIn(STOREFRONT_ANALYTICS_EVENT_NAMES)
  eventName!: StorefrontAnalyticsEventName;

  @IsOptional()
  @IsUUID()
  cartId?: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  sessionId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
