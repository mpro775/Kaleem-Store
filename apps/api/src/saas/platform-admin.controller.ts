import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { getRequestContext } from '../common/utils/request-context.util';
import { AssignStorePlanDto } from './dto/assign-store-plan.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { ListPlatformStoresQueryDto } from './dto/list-platform-stores-query.dto';
import { ListPlatformSubscriptionsQueryDto } from './dto/list-platform-subscriptions-query.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateStoreSuspensionDto } from './dto/update-store-suspension.dto';
import { PlatformAdminGuard } from './platform-admin.guard';
import { PlanResponse, SaasService, StoreSubscriptionResponse } from './saas.service';

@ApiTags('platform-admin')
@ApiHeader({
  name: 'x-platform-admin-secret',
  description: 'Platform admin shared secret',
  required: true,
})
@Controller('platform')
@UseGuards(PlatformAdminGuard)
export class PlatformAdminController {
  constructor(private readonly saasService: SaasService) {}

  @Get('plans')
  @ApiOkResponse({ description: 'List all SaaS plans with limits' })
  async listPlans(): Promise<PlanResponse[]> {
    return this.saasService.listPlans();
  }

  @Post('plans')
  @ApiCreatedResponse({ description: 'Create new SaaS plan with limits' })
  async createPlan(@Body() body: CreatePlanDto): Promise<PlanResponse> {
    return this.saasService.createPlan(body);
  }

  @Put('plans/:planId')
  @ApiOkResponse({ description: 'Update existing plan and optional limits' })
  async updatePlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() body: UpdatePlanDto,
  ): Promise<PlanResponse> {
    return this.saasService.updatePlan(planId, body);
  }

  @Post('stores/:storeId/subscription')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Assign current subscription plan to store' })
  async assignStorePlan(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() body: AssignStorePlanDto,
    @Req() request: Request,
  ): Promise<StoreSubscriptionResponse> {
    return this.saasService.assignStorePlan(storeId, body, getRequestContext(request));
  }

  @Get('subscriptions')
  @ApiOkResponse({ description: 'List current subscriptions across stores' })
  async listSubscriptions(@Query() query: ListPlatformSubscriptionsQueryDto) {
    return this.saasService.listPlatformSubscriptions(query);
  }

  @Get('stores')
  @ApiOkResponse({ description: 'List stores and platform statuses' })
  async listStores(@Query() query: ListPlatformStoresQueryDto) {
    return this.saasService.listPlatformStores(query);
  }

  @Patch('stores/:storeId/suspension')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Update store suspension status' })
  async updateStoreSuspension(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() body: UpdateStoreSuspensionDto,
    @Req() request: Request,
  ): Promise<void> {
    await this.saasService.updateStoreSuspension(storeId, body, getRequestContext(request));
  }

  @Get('domains')
  @ApiOkResponse({ description: 'List domain statuses across stores' })
  async listDomains() {
    return this.saasService.listPlatformDomains();
  }

  @Post('stores/:storeId/subscription/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Cancel store subscription' })
  async cancelSubscription(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Req() request: Request,
  ): Promise<StoreSubscriptionResponse> {
    return this.saasService.cancelSubscription(storeId, getRequestContext(request));
  }

  @Post('stores/:storeId/subscription/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Suspend store subscription' })
  async suspendSubscription(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() body: { reason?: string },
    @Req() request: Request,
  ): Promise<StoreSubscriptionResponse> {
    return this.saasService.suspendSubscription(
      storeId,
      body.reason ?? null,
      getRequestContext(request),
    );
  }

  @Post('stores/:storeId/subscription/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Resume suspended or canceled subscription' })
  async resumeSubscription(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Req() request: Request,
  ): Promise<StoreSubscriptionResponse> {
    return this.saasService.resumeSubscription(storeId, getRequestContext(request));
  }

  @Get('stores/:storeId/subscription/can-downgrade/:planCode')
  @ApiOkResponse({ description: 'Check if store can downgrade to a plan' })
  async canDowngradePlan(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('planCode') planCode: string,
  ) {
    return this.saasService.canDowngradePlan(storeId, planCode);
  }
}
