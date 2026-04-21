import { IsString, MaxLength } from 'class-validator';

export class StoreSlugAvailabilityQueryDto {
  @IsString()
  @MaxLength(80)
  slug!: string;
}
