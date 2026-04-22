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
import { CurrentPlatformUser } from '../platform/decorators/current-platform-user.decorator';
import { RequirePlatformPermissions } from '../platform/decorators/require-platform-permissions.decorator';
import { RequirePlatformStepUp } from '../platform/decorators/require-platform-step-up.decorator';
import { PlatformAccessTokenGuard } from '../platform/guards/platform-access-token.guard';
import { PlatformPermissionsGuard } from '../platform/guards/platform-permissions.guard';
import { PlatformStepUpGuard } from '../platform/guards/platform-step-up.guard';
import type { PlatformAdminUser } from '../platform/interfaces/platform-admin-user.interface';
import { AssignStorePlanDto } from './dto/assign-store-plan.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreatePlatformAdminDto } from './dto/create-platform-admin.dto';
import { CreatePlatformAutomationRuleDto } from './dto/create-platform-automation-rule.dto';
import { CreatePlatformComplianceTaskDto } from './dto/create-platform-compliance-task.dto';
import { CreatePlatformIncidentDto } from './dto/create-platform-incident.dto';
import { CreatePlatformRiskViolationDto } from './dto/create-platform-risk-violation.dto';
import { CreatePlatformRoleDto } from './dto/create-platform-role.dto';
import { CreatePlatformSupportCaseDto } from './dto/create-platform-support-case.dto';
import { CreateStoreNoteDto } from './dto/create-store-note.dto';
import { ListPlatformStoresQueryDto } from './dto/list-platform-stores-query.dto';
import { ListPlatformSubscriptionsQueryDto } from './dto/list-platform-subscriptions-query.dto';
import { SettleInvoiceDto } from './dto/settle-invoice.dto';
import { TriggerPlatformAutomationRuleDto } from './dto/trigger-platform-automation-rule.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdatePlatformAdminDto } from './dto/update-platform-admin.dto';
import { UpdatePlatformAutomationRuleStatusDto } from './dto/update-platform-automation-rule-status.dto';
import { UpdatePlatformComplianceTaskStatusDto } from './dto/update-platform-compliance-task-status.dto';
import { UpdatePlatformIncidentStatusDto } from './dto/update-platform-incident-status.dto';
import { UpdatePlatformRiskViolationStatusDto } from './dto/update-platform-risk-violation-status.dto';
import { UpdatePlatformRoleDto } from './dto/update-platform-role.dto';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { UpdatePlatformSupportCaseDto } from './dto/update-platform-support-case.dto';
import { UpdateStoreSuspensionDto } from './dto/update-store-suspension.dto';
import { PlanResponse, SaasService, StoreSubscriptionResponse } from './saas.service';

@ApiTags('platform-admin')
@ApiBearerAuth()
@Controller('platform')
@UseGuards(PlatformAccessTokenGuard, PlatformPermissionsGuard, PlatformStepUpGuard)
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
  @RequirePlatformStepUp()
  @ApiCreatedResponse({ description: 'Create new SaaS plan with limits' })
  async createPlan(@Body() body: CreatePlanDto): Promise<PlanResponse> {
    return this.saasService.createPlan(body);
  }

  @Put('plans/:planId')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.plansWrite)
  @RequirePlatformStepUp()
  @ApiOkResponse({ description: 'Update existing plan and optional limits' })
  async updatePlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() body: UpdatePlanDto,
  ): Promise<PlanResponse> {
    return this.saasService.updatePlan(planId, body);
  }

  @Post('plans/:planId/archive')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.plansWrite)
  @RequirePlatformStepUp()
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
  @RequirePlatformStepUp()
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
  @RequirePlatformStepUp()
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

  @Get('stores/:storeId/store-360')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.storesRead)
  @ApiOkResponse({ description: 'Get full store 360 operational view (multi-tab payload)' })
  async getStore360(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.saasService.getPlatformStore360(storeId);
  }

  @Patch('stores/:storeId/suspension')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.storesSuspend)
  @RequirePlatformStepUp()
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
  @RequirePlatformStepUp()
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
  @RequirePlatformStepUp()
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
  @RequirePlatformStepUp()
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
  @RequirePlatformStepUp()
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
  @RequirePlatformStepUp()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Settle an invoice manually (succeeded/failed)' })
  async settleInvoice(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() body: SettleInvoiceDto,
    @Req() request: Request,
  ) {
    return this.saasService.settleInvoice(invoiceId, body, getRequestContext(request));
  }

  @Get('audit/logs')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.auditRead)
  @ApiOkResponse({ description: 'List platform audit logs with optional filters' })
  async listAuditLogs(
    @Query('q') q?: string,
    @Query('action') action?: string,
    @Query('storeId') storeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const input: { q?: string; action?: string; storeId?: string; page?: number; limit?: number } = {};
    if (q !== undefined) input.q = q;
    if (action !== undefined) input.action = action;
    if (storeId !== undefined) input.storeId = storeId;
    if (page !== undefined) input.page = Number(page);
    if (limit !== undefined) input.limit = Number(limit);
    return this.saasService.listPlatformAuditLogs(input);
  }

  @Get('health/summary')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.healthRead)
  @ApiOkResponse({ description: 'Platform health summary' })
  async getHealthSummary() {
    return this.saasService.getPlatformHealthSummary();
  }

  @Get('health/queues')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.healthRead)
  @ApiOkResponse({ description: 'Platform queue backlog and failed jobs overview' })
  async getHealthQueues() {
    return this.saasService.getPlatformHealthQueues();
  }

  @Get('health/incidents')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.healthRead)
  @ApiOkResponse({ description: 'Platform incidents list' })
  async listIncidents() {
    return this.saasService.listPlatformIncidents();
  }

  @Post('health/incidents')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.healthRead)
  @RequirePlatformStepUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Create platform incident' })
  async createIncident(
    @Body() body: CreatePlatformIncidentDto,
    @CurrentPlatformUser() currentUser: PlatformAdminUser,
    @Req() request: Request,
  ) {
    return this.saasService.createPlatformIncident(body, currentUser, getRequestContext(request));
  }

  @Patch('health/incidents/:incidentId/status')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.healthRead)
  @RequirePlatformStepUp()
  @ApiOkResponse({ description: 'Update platform incident status' })
  async updateIncidentStatus(
    @Param('incidentId', ParseUUIDPipe) incidentId: string,
    @Body() body: UpdatePlatformIncidentStatusDto,
    @Req() request: Request,
  ) {
    return this.saasService.updatePlatformIncidentStatus(
      incidentId,
      body,
      getRequestContext(request),
    );
  }

  @Get('onboarding/pipeline')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.onboardingRead)
  @ApiOkResponse({ description: 'Onboarding pipeline for platform operations' })
  async getOnboardingPipeline() {
    return this.saasService.getPlatformOnboardingPipeline();
  }

  @Get('onboarding/stuck-stores')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.onboardingRead)
  @ApiOkResponse({ description: 'Stuck stores requiring success intervention' })
  async getOnboardingStuckStores() {
    return this.saasService.getPlatformOnboardingStuckStores();
  }

  @Get('stores/:storeId/notes')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.notesRead)
  @ApiOkResponse({ description: 'List internal platform notes for a store' })
  async listStoreNotes(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.saasService.listPlatformStoreNotes(storeId);
  }

  @Post('stores/:storeId/notes')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.notesWrite)
  @RequirePlatformStepUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Create internal platform note for a store' })
  async createStoreNote(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() body: CreateStoreNoteDto,
    @CurrentPlatformUser() currentUser: PlatformAdminUser,
    @Req() request: Request,
  ) {
    return this.saasService.createPlatformStoreNote(
      storeId,
      body,
      currentUser,
      getRequestContext(request),
    );
  }

  @Get('admins')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.adminsRead)
  @ApiOkResponse({ description: 'List platform admins' })
  async listAdmins() {
    return this.saasService.listPlatformAdmins();
  }

  @Post('admins')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.adminsWrite)
  @RequirePlatformStepUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Create platform admin' })
  async createAdmin(
    @Body() body: CreatePlatformAdminDto,
    @CurrentPlatformUser() currentUser: PlatformAdminUser,
    @Req() request: Request,
  ) {
    return this.saasService.createPlatformAdmin(body, currentUser, getRequestContext(request));
  }

  @Patch('admins/:adminId')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.adminsWrite)
  @RequirePlatformStepUp()
  @ApiOkResponse({ description: 'Update platform admin' })
  async updateAdmin(
    @Param('adminId', ParseUUIDPipe) adminId: string,
    @Body() body: UpdatePlatformAdminDto,
    @CurrentPlatformUser() currentUser: PlatformAdminUser,
    @Req() request: Request,
  ) {
    return this.saasService.updatePlatformAdmin(
      adminId,
      body,
      currentUser,
      getRequestContext(request),
    );
  }

  @Get('roles')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.rolesRead)
  @ApiOkResponse({ description: 'List platform roles and permissions' })
  async listRoles() {
    return this.saasService.listPlatformRoles();
  }

  @Post('roles')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.rolesWrite)
  @RequirePlatformStepUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Create platform role' })
  async createRole(
    @Body() body: CreatePlatformRoleDto,
    @CurrentPlatformUser() currentUser: PlatformAdminUser,
    @Req() request: Request,
  ) {
    return this.saasService.createPlatformRole(body, currentUser, getRequestContext(request));
  }

  @Patch('roles/:roleId')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.rolesWrite)
  @RequirePlatformStepUp()
  @ApiOkResponse({ description: 'Update platform role' })
  async updateRole(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() body: UpdatePlatformRoleDto,
    @CurrentPlatformUser() currentUser: PlatformAdminUser,
    @Req() request: Request,
  ) {
    return this.saasService.updatePlatformRole(roleId, body, currentUser, getRequestContext(request));
  }

  @Get('settings')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.settingsRead)
  @ApiOkResponse({ description: 'List platform global settings' })
  async getPlatformSettings() {
    return this.saasService.getPlatformSettings();
  }

  @Patch('settings')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.settingsWrite)
  @RequirePlatformStepUp()
  @ApiOkResponse({ description: 'Update platform global settings' })
  async patchPlatformSettings(
    @Body() body: UpdatePlatformSettingsDto,
    @CurrentPlatformUser() currentUser: PlatformAdminUser,
    @Req() request: Request,
  ) {
    return this.saasService.updatePlatformSettings(body, currentUser, getRequestContext(request));
  }

  @Get('automation/rules')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.automationRead)
  @ApiOkResponse({ description: 'List platform automation rules' })
  async listAutomationRules() {
    return this.saasService.listPlatformAutomationRules();
  }

  @Post('automation/rules')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.automationWrite)
  @RequirePlatformStepUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Create platform automation rule' })
  async createAutomationRule(
    @Body() body: CreatePlatformAutomationRuleDto,
    @CurrentPlatformUser() currentUser: PlatformAdminUser,
    @Req() request: Request,
  ) {
    return this.saasService.createPlatformAutomationRule(body, currentUser, getRequestContext(request));
  }

  @Patch('automation/rules/:ruleId/status')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.automationWrite)
  @RequirePlatformStepUp()
  @ApiOkResponse({ description: 'Enable/disable automation rule' })
  async updateAutomationRuleStatus(
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
    @Body() body: UpdatePlatformAutomationRuleStatusDto,
    @CurrentPlatformUser() currentUser: PlatformAdminUser,
    @Req() request: Request,
  ) {
    return this.saasService.updatePlatformAutomationRuleStatus(
      ruleId,
      body,
      currentUser,
      getRequestContext(request),
    );
  }

  @Post('automation/rules/:ruleId/run')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.automationRun)
  @RequirePlatformStepUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Trigger automation rule run manually' })
  async runAutomationRule(
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
    @Body() body: TriggerPlatformAutomationRuleDto,
    @CurrentPlatformUser() currentUser: PlatformAdminUser,
    @Req() request: Request,
  ) {
    return this.saasService.triggerPlatformAutomationRule(
      ruleId,
      body,
      currentUser,
      getRequestContext(request),
    );
  }

  @Get('automation/runs')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.automationRead)
  @ApiOkResponse({ description: 'List recent platform automation runs' })
  async listAutomationRuns(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 100;
    return this.saasService.listPlatformAutomationRuns(Number.isFinite(parsed) ? parsed : 100);
  }

  @Get('support/cases')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.supportRead)
  @ApiOkResponse({ description: 'List platform support cases' })
  async listSupportCases(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 100;
    return this.saasService.listPlatformSupportCases(Number.isFinite(parsed) ? parsed : 100);
  }

  @Post('support/cases')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.supportWrite)
  @RequirePlatformStepUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Create support case' })
  async createSupportCase(
    @Body() body: CreatePlatformSupportCaseDto,
    @CurrentPlatformUser() currentUser: PlatformAdminUser,
    @Req() request: Request,
  ) {
    return this.saasService.createPlatformSupportCase(body, currentUser, getRequestContext(request));
  }

  @Patch('support/cases/:caseId')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.supportWrite)
  @RequirePlatformStepUp()
  @ApiOkResponse({ description: 'Update support case status/assignment' })
  async updateSupportCase(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() body: UpdatePlatformSupportCaseDto,
    @CurrentPlatformUser() currentUser: PlatformAdminUser,
    @Req() request: Request,
  ) {
    return this.saasService.updatePlatformSupportCase(
      caseId,
      body,
      currentUser,
      getRequestContext(request),
    );
  }

  @Get('risk/violations')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.riskRead)
  @ApiOkResponse({ description: 'List risk violations' })
  async listRiskViolations(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 100;
    return this.saasService.listPlatformRiskViolations(Number.isFinite(parsed) ? parsed : 100);
  }

  @Post('risk/violations')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.riskWrite)
  @RequirePlatformStepUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Create risk violation' })
  async createRiskViolation(
    @Body() body: CreatePlatformRiskViolationDto,
    @CurrentPlatformUser() currentUser: PlatformAdminUser,
    @Req() request: Request,
  ) {
    return this.saasService.createPlatformRiskViolation(body, currentUser, getRequestContext(request));
  }

  @Patch('risk/violations/:violationId/status')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.riskWrite)
  @RequirePlatformStepUp()
  @ApiOkResponse({ description: 'Update risk violation status' })
  async updateRiskViolationStatus(
    @Param('violationId', ParseUUIDPipe) violationId: string,
    @Body() body: UpdatePlatformRiskViolationStatusDto,
    @Req() request: Request,
  ) {
    return this.saasService.updatePlatformRiskViolationStatus(
      violationId,
      body,
      getRequestContext(request),
    );
  }

  @Get('compliance/tasks')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.complianceRead)
  @ApiOkResponse({ description: 'List compliance tasks' })
  async listComplianceTasks(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 100;
    return this.saasService.listPlatformComplianceTasks(Number.isFinite(parsed) ? parsed : 100);
  }

  @Post('compliance/tasks')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.complianceWrite)
  @RequirePlatformStepUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Create compliance task' })
  async createComplianceTask(
    @Body() body: CreatePlatformComplianceTaskDto,
    @CurrentPlatformUser() currentUser: PlatformAdminUser,
    @Req() request: Request,
  ) {
    return this.saasService.createPlatformComplianceTask(body, currentUser, getRequestContext(request));
  }

  @Patch('compliance/tasks/:taskId/status')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.complianceWrite)
  @RequirePlatformStepUp()
  @ApiOkResponse({ description: 'Update compliance task status' })
  async updateComplianceTaskStatus(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() body: UpdatePlatformComplianceTaskStatusDto,
    @Req() request: Request,
  ) {
    return this.saasService.updatePlatformComplianceTaskStatus(taskId, body, getRequestContext(request));
  }

  @Get('finance/overview')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.financeRead)
  @ApiOkResponse({ description: 'Finance operations overview' })
  async getFinanceOverview() {
    return this.saasService.getPlatformFinanceOverview();
  }

  @Get('finance/aging')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.financeRead)
  @ApiOkResponse({ description: 'Finance aging buckets' })
  async getFinanceAging() {
    return this.saasService.listPlatformFinanceAging();
  }

  @Get('finance/collections')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.financeRead)
  @ApiOkResponse({ description: 'Finance collections worklist' })
  async listFinanceCollections(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 100;
    return this.saasService.listPlatformFinanceCollections(Number.isFinite(parsed) ? parsed : 100);
  }

  @Get('analytics/overview')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.analyticsRead)
  @ApiOkResponse({ description: 'Platform analytics overview (MRR/Churn/Cohorts/Funnel)' })
  async getAnalyticsOverview() {
    return this.saasService.getPlatformAnalyticsOverview();
  }

  @Get('analytics/mrr-churn')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.analyticsRead)
  @ApiOkResponse({ description: 'Platform MRR and churn analytics' })
  async getAnalyticsMrrChurn() {
    return this.saasService.getPlatformAnalyticsMrrChurn();
  }

  @Get('analytics/cohorts')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.analyticsRead)
  @ApiOkResponse({ description: 'Platform cohort analytics' })
  async getAnalyticsCohorts() {
    return this.saasService.getPlatformAnalyticsCohorts();
  }

  @Get('analytics/funnel')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.analyticsRead)
  @ApiOkResponse({ description: 'Platform funnel analytics' })
  async getAnalyticsFunnel() {
    return this.saasService.getPlatformAnalyticsFunnel();
  }

  @Get('billing/events')
  @RequirePlatformPermissions(PLATFORM_PERMISSIONS.auditRead)
  @ApiOkResponse({ description: 'List recent billing lifecycle events' })
  async listBillingEvents(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 50;
    return this.saasService.listPlatformBillingEvents(Number.isFinite(parsed) ? parsed : 50);
  }
}
