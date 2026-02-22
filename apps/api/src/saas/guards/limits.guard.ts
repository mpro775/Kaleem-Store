import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { type SaasMetricKey, METRIC_DISPLAY_NAMES } from '../constants/saas-metrics.constants';
import { SaasService } from '../saas.service';

export const LIMIT_CHECK_KEY = 'limit_check';

export interface LimitCheckConfig {
  metricKey: SaasMetricKey;
  increment?: number;
}

export function RequireLimit(config: LimitCheckConfig) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(LIMIT_CHECK_KEY, config, descriptor.value);
    return descriptor;
  };
}

@Injectable()
export class LimitsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly saasService: SaasService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const config = this.reflector.get<LimitCheckConfig | undefined>(LIMIT_CHECK_KEY, handler);

    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    if (!user?.storeId) {
      return true;
    }

    try {
      await this.saasService.assertMetricCanGrow(
        user.storeId,
        config.metricKey,
        config.increment ?? 1,
      );
      return true;
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        const displayName = METRIC_DISPLAY_NAMES[config.metricKey] ?? config.metricKey;
        throw new UnprocessableEntityException(
          `You have reached the limit for ${displayName}. Please upgrade your plan to add more.`,
        );
      }
      throw error;
    }
  }
}
