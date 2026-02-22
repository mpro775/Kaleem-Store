import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterOwnerDto {
  @IsString()
  @MaxLength(120)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  @MaxLength(120)
  storeName!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(80)
  storeSlug!: string;
}
