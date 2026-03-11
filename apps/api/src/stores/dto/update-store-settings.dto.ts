import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class UpdateStoreSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  currencyCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  shippingPolicy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  returnPolicy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  privacyPolicy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  termsAndConditions?: string;
}
