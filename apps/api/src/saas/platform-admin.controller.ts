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
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { getRequestContext } from '../common/utils/request-context.util';
import { PLATFORM_PERMISSIONS } from '../platform/constants/platform-permissions.constants';
import { RequirePlatformPermissions } from '../platform/decorators/require-platform-permissions.decorator';
import { PlatformAccessTokenGuard } from '../platform/guards/platform-access-token.guard';
import { PlatformPermissionsGuard } from '../platform/guards/platform-permissions.guard';
import { AssignStorePlanDto } from './dto/assign-store-plan.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { ListPlatformStoresQueryDto } from './dto/list-platform-stores-query.dto';
import { ListPlatformSubscriptionsQueryDto } from './dto/list-platform-subscriptions-query.dto';
import { SettleInvoiceDto } from './dto/settle-invoice.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateStoreSuspensionDto } from './dto/update-store-suspension.dto';
import { PlanResponse, SaasService, StoreSubscriptionResponse } from './saas.service';

@ApiTags('platform-admin')
@ApiBearerAuth()
@Controller('platform')
@UseGuards(PlatformAccessTokenGuard, PlatformPermissionsGuard)
export class PlatformAdminController {
  constructor(private readonly saasService: SaasService) {}

  @Get('dashboard/summary')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.dashboardRead)
  @ApiOkResponse({ description: 'Platform dashboard summary KPIs' })
  async getDashboardSummary() {
    return this.saasService.getPlatformDashboardSummary();
  }

  @Get('dashboard/alerts')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.dashboardRead)
  @ApiOkResponse({ description: 'Platform dashboard alerts feed' })
  async getDashboardAlerts() {
    return this.saasService.getPlatformDashboardAlerts();
  }

  @Get('dashboard/activity')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.dashboardRead)
  @ApiOkResponse({ description: 'Platform dashboard recent activity' })
  async getDashboardActivity() {
    return this.saasService.getPlatformDashboardActivity();
  }

  @Get('dashboard/growth')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.dashboardRead)
  @ApiOkResponse({ description: 'Platform dashboard growth snapshots' })
  async getDashboardGrowth() {
    return this.saasService.getPlatformDashboardGrowth();
  }

  @Get('plans')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.plansRead)
  @ApiOkResponse({ description: 'List all SaaS plans with limits' })
  async listPlans(): Promise<PlanResponse[]> {
    return this.saasService.listPlans();
  }

  @Post('plans')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.plansWrite)
  @ApiCreatedResponse({ description: 'Create new SaaS plan with limits' })
  async createPlan(@Body() body: CreatePlanDto): Promise<PlanResponse> {
    return this.saasService.createPlan(body);
  }

  @Put('plans/:planId')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.plansWrite)
  @ApiOkResponse({ description: 'Update existing plan and optional limits' })
  async updatePlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() body: UpdatePlanDto,
  ): Promise<PlanResponse> {
    return this.saasService.updatePlan(planId, body);
  }

  @Post('plans/:planId/archive')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.plansWrite)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Archive a plan by marking it inactive' })
  async archivePlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Req() request: Request,
  ): Promise<PlanResponse> {
    return this.saasService.archivePlan(planId, getRequestContext(request));
  }

  @Post('plans/:planId/duplicate')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.plansWrite)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Duplicate a plan with limits and entitlements' })
  async duplicatePlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Req() request: Request,
  ): Promise<PlanResponse> {
    return this.saasService.duplicatePlan(planId, getRequestContext(request));
  }

  @Post('stores/:storeId/subscription')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.subscriptionsWrite)
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
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.subscriptionsRead)
  @ApiOkResponse({ description: 'List current subscriptions across stores' })
  async listSubscriptions(@Query() query: ListPlatformSubscriptionsQueryDto) {
    return this.saasService.listPlatformSubscriptions(query);
  }

  @Get('stores')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.storesRead)
  @ApiOkResponse({ description: 'List stores and platform statuses' })
  async listStores(@Query() query: ListPlatformStoresQueryDto) {
    return this.saasService.listPlatformStores(query);
  }

  @Get('stores/:storeId')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.storesRead)
  @ApiOkResponse({ description: 'Get store details for platform admin' })
  async getStoreById(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.saasService.getPlatformStoreById(storeId);
  }

  @Get('stores/:storeId/usage')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.storesRead)
  @ApiOkResponse({ description: 'Get store usage snapshot based on current plan limits' })
  async getStoreUsage(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.saasService.getPlatformStoreUsage(storeId);
  }

  @Get('stores/:storeId/activity')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.storesRead)
  @ApiOkResponse({ description: 'Get latest store activity log feed' })
  async getStoreActivity(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.saasService.getPlatformStoreActivity(storeId);
  }

  @Get('stores/:storeId/domains')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.domainsRead)
  @ApiOkResponse({ description: 'Get store domains from platform perspective' })
  async getStoreDomains(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.saasService.getPlatformStoreDomains(storeId);
  }

  @Get('stores/:storeId/subscription')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.subscriptionsRead)
  @ApiOkResponse({ description: 'Get store current subscription details' })
  async getStoreSubscription(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.saasService.getPlatformStoreSubscription(storeId);
  }

  @Patch('stores/:storeId/suspension')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.storesSuspend)
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
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.domainsRead)
  @ApiOkResponse({ description: 'List domain statuses across stores' })
  async listDomains() {
    return this.saasService.listPlatformDomains();
  }

  @Get('domains/issues')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.domainsRead)
  @ApiOkResponse({ description: 'List domains with operational issues' })
  async listDomainIssues() {
    return this.saasService.listPlatformDomainIssues();
  }

  @Get('domains/:domainId')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.domainsRead)
  @ApiOkResponse({ description: 'Get domain details for platform operations' })
  async getDomainById(@Param('domainId', ParseUUIDPipe) domainId: string) {
    return this.saasService.getPlatformDomainById(domainId);
  }

  @Post('domains/:domainId/recheck')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.domainsWrite)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Recheck domain SSL/DNS state' })
  async recheckDomain(
    @Param('domainId', ParseUUIDPipe) domainId: string,
    @Req() request: Request,
  ) {
    return this.saasService.recheckPlatformDomain(domainId, getRequestContext(request));
  }

  @Post('domains/:domainId/force-sync')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.domainsWrite)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Force sync domain state and mark operational refresh' })
  async forceSyncDomain(
    @Param('domainId', ParseUUIDPipe) domainId: string,
    @Req() request: Request,
  ) {
    return this.saasService.forceSyncPlatformDomain(domainId, getRequestContext(request));
  }

  @Post('stores/:storeId/subscription/cancel')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.subscriptionsWrite)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Cancel store subscription' })
  async cancelSubscription(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Req() request: Request,
  ): Promise<StoreSubscriptionResponse> {
    return this.saasService.cancelSubscription(storeId, getRequestContext(request));
  }

  @Post('stores/:storeId/subscription/suspend')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.subscriptionsWrite)
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
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.subscriptionsWrite)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Resume suspended or canceled subscription' })
  async resumeSubscription(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Req() request: Request,
  ): Promise<StoreSubscriptionResponse> {
    return this.saasService.resumeSubscription(storeId, getRequestContext(request));
  }

  @Get('stores/:storeId/subscription/can-downgrade/:planCode')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.subscriptionsRead)
  @ApiOkResponse({ description: 'Check if store can downgrade to a plan' })
  async canDowngradePlan(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('planCode') planCode: string,
  ) {
    return this.saasService.canDowngradePlan(storeId, planCode);
  }

  @Post('invoices/:invoiceId/settle')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.subscriptionsWrite)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Settle an invoice manually (succeeded/failed)' })
  async settleInvoice(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() body: SettleInvoiceDto,
    @Req() request: Request,
  ) {
    return this.saasService.settleInvoice(invoiceId, body, getRequestContext(request));
  }

  @Get('billing/events')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.auditRead)
  @ApiOkResponse({ description: 'List recent billing lifecycle events' })
  async listBillingEvents(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 50;
    return this.saasService.listPlatformBillingEvents(Number.isFinite(parsed) ? parsed : 50);
  }
}
