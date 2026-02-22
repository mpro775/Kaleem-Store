import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListAttributeValuesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}
