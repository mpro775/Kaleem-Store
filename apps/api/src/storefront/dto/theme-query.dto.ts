import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ThemeQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  previewToken?: string;
}
