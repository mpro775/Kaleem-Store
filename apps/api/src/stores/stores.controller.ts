import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PERMISSIONS } from '../auth/constants/permission.constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { getRequestContext } from '../common/utils/request-context.util';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { TenantGuard } from '../tenancy/guards/tenant.guard';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { StoresService, type StoreSettingsResponse } from './stores.service';

@ApiTags('store')
@ApiBearerAuth()
@Controller('store')
@UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('settings')
  @RequirePermissions(PERMISSIONS.storeRead)
  @ApiOkResponse({ description: 'Get store settings' })
  async getSettings(@CurrentUser() user: AuthUser): Promise<StoreSettingsResponse> {
    return this.storesService.getSettings(user);
  }

  @Put('settings')
  @RequirePermissions(PERMISSIONS.storeWrite)
  @ApiOkResponse({ description: 'Update store settings' })
  async updateSettings(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateStoreSettingsDto,
    @Req() request: Request,
  ): Promise<StoreSettingsResponse> {
    return this.storesService.updateSettings(user, body, getRequestContext(request));
  }
}
