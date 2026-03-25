import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateAttributeValueDto {
  @IsString()
  @MaxLength(120)
  value!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  valueAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  valueEn?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(120)
  slug?: string;
}
