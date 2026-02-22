import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateAttributeValueDto {
  @IsString()
  @MaxLength(120)
  value!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(120)
  slug?: string;
}
