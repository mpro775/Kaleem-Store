import { IsInt, IsOptional, IsString, MaxLength, NotEquals } from 'class-validator';

export class AdjustInventoryDto {
  @IsInt()
  @NotEquals(0)
  quantityDelta!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
