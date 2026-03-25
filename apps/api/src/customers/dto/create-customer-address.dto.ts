import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCustomerAddressDto {
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
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
