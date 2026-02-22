import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
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
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ordersRead)
  @ApiOkResponse({ description: 'List orders' })
  async list(@CurrentUser() currentUser: AuthUser, @Query() query: ListOrdersQueryDto) {
    return this.ordersService.list(currentUser, query);
  }

  @Get(':orderId')
  @RequirePermissions(PERMISSIONS.ordersRead)
  @ApiOkResponse({ description: 'Get order details' })
  async getById(
    @CurrentUser() currentUser: AuthUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.ordersService.getById(currentUser, orderId);
  }

  @Patch(':orderId/status')
  @RequirePermissions(PERMISSIONS.ordersWrite)
  @ApiOkResponse({ description: 'Update order status' })
  async updateStatus(
    @CurrentUser() currentUser: AuthUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: UpdateOrderStatusDto,
    @Req() request: Request,
  ) {
    return this.ordersService.updateStatus(currentUser, orderId, body, getRequestContext(request));
  }
}
