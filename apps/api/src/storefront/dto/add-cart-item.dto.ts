import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @IsOptional()
  @IsUUID('4')
  cartId?: string;

  @IsUUID('4')
  variantId!: string;

  @IsInt()
  @Min(1)
  @Max(50)
  quantity!: number;
}
