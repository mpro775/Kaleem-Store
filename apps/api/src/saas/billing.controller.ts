import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../auth/constants/permission.constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { TenantGuard } from '../tenancy/guards/tenant.guard';
import { METRIC_DISPLAY_NAMES, type SaasMetricKey } from './constants/saas-metrics.constants';
import { SaasService, type StoreSubscriptionResponse } from './saas.service';

interface UsageItem {
  metricKey: SaasMetricKey;
  displayName: string;
  used: number;
  limit: number | null;
  resetPeriod: string;
  percentage: number | null;
  isOverLimit: boolean;
}

interface UsageResponse {
  usage: UsageItem[];
  plan: {
    code: string;
    name: string;
  };
  status: string;
}

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(AccessTokenGuard, TenantGuard, PermissionsGuard)
export class BillingController {
  constructor(private readonly saasService: SaasService) {}

  @Get('subscription')
  @RequirePermissions(PERMISSIONS.storeRead)
  @ApiOkResponse({ description: 'Get current store subscription and usage snapshot' })
  async getCurrentSubscription(
    @CurrentUser() currentUser: AuthUser,
  ): Promise<StoreSubscriptionResponse> {
    return this.saasService.getCurrentStoreSubscription(currentUser);
  }

  @Get('usage')
  @RequirePermissions(PERMISSIONS.storeRead)
  @ApiOkResponse({ description: 'Get detailed usage with percentage and limit warnings' })
  async getDetailedUsage(@CurrentUser() currentUser: AuthUser): Promise<UsageResponse> {
    const subscription = await this.saasService.getCurrentStoreSubscription(currentUser);

    const usage: UsageItem[] = subscription.usage.map((item) => ({
      metricKey: item.metricKey as SaasMetricKey,
      displayName: METRIC_DISPLAY_NAMES[item.metricKey as SaasMetricKey] ?? item.metricKey,
      used: item.used,
      limit: item.limit,
      resetPeriod: item.resetPeriod,
      percentage: item.limit !== null ? Math.round((item.used / item.limit) * 100) : null,
      isOverLimit: item.limit !== null && item.used >= item.limit,
    }));

    return {
      usage,
      plan: {
        code: subscription.plan.code,
        name: subscription.plan.name,
      },
      status: subscription.status,
    };
  }
}
