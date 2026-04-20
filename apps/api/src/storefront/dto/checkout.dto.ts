import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PAYMENT_METHODS, type PaymentMethod } from '../../orders/constants/payment.constants';

export class CheckoutDto {
  @IsUUID('4')
  cartId!: string;

  @IsString()
  @MaxLength(120)
  customerName!: string;

  @IsString()
  @MaxLength(30)
  customerPhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  customerEmail?: string;

  @IsString()
  @MaxLength(250)
  addressLine!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  area?: string;

  @IsOptional()
  @IsUUID('4')
  shippingZoneId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  couponCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsIn(PAYMENT_METHODS)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  customerAccessToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  restockToken?: string;
}
