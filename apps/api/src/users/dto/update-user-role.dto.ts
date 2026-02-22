import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import type { StoreRole } from '../../auth/interfaces/auth-user.interface';

export class UpdateUserRoleDto {
  @IsIn(['owner', 'staff'])
  role!: StoreRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
