import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { FILTER_TYPES } from '../constants/filter-type.constants';

export class CreateFilterDto {
  @IsString()
  @MaxLength(120)
  nameAr!: string;

  @IsString()
  @MaxLength(120)
  nameEn!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(120)
  slug?: string;

  @IsIn(FILTER_TYPES)
  type!: (typeof FILTER_TYPES)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
