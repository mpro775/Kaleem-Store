import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { PERMISSIONS } from '../auth/constants/permission.constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { getRequestContext } from '../common/utils/request-context.util';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { TenantGuard } from '../tenancy/guards/tenant.guard';
import { CreateShippingZoneDto } from './dto/create-shipping-zone.dto';
import { ListShippingZonesQueryDto } from './dto/list-shipping-zones-query.dto';
import { UpdateShippingZoneDto } from './dto/update-shipping-zone.dto';
import { ShippingService, type ShippingZoneResponse } from './shipping.service';

@ApiTags('shipping')
@ApiBearerAuth()
@Controller('shipping-zones')
@UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.storeWrite)
  @ApiCreatedResponse({ description: 'Create shipping zone' })
  async create(
    @CurrentUser() currentUser: AuthUser,
    @Body() body: CreateShippingZoneDto,
    @Req() request: Request,
  ): Promise<ShippingZoneResponse> {
    return this.shippingService.create(currentUser, body, getRequestContext(request));
  }

  @Get()
  @RequirePermissions(PERMISSIONS.storeRead)
  @ApiOkResponse({ description: 'List shipping zones' })
  async list(
    @CurrentUser() currentUser: AuthUser,
    @Query() query: ListShippingZonesQueryDto,
  ): Promise<ShippingZoneResponse[]> {
    return this.shippingService.list(currentUser, query);
  }

  @Put(':zoneId')
  @RequirePermissions(PERMISSIONS.storeWrite)
  @ApiOkResponse({ description: 'Update shipping zone' })
  async update(
    @CurrentUser() currentUser: AuthUser,
    @Param('zoneId', ParseUUIDPipe) zoneId: string,
    @Body() body: UpdateShippingZoneDto,
    @Req() request: Request,
  ): Promise<ShippingZoneResponse> {
    return this.shippingService.update(currentUser, zoneId, body, getRequestContext(request));
  }

  @Delete(':zoneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.storeWrite)
  @ApiNoContentResponse({ description: 'Delete shipping zone' })
  async remove(
    @CurrentUser() currentUser: AuthUser,
    @Param('zoneId', ParseUUIDPipe) zoneId: string,
    @Req() request: Request,
  ): Promise<void> {
    await this.shippingService.remove(currentUser, zoneId, getRequestContext(request));
  }
}
