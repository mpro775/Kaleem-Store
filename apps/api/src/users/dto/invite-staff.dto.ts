import { IsArray, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import type { StoreRole } from '../../auth/interfaces/auth-user.interface';

export class InviteStaffDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsIn(['owner', 'staff'])
  role!: StoreRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
