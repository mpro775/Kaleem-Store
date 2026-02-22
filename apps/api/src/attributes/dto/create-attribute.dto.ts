import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateAttributeDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(120)
  slug?: string;
}
