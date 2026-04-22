import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module';
import { SecurityModule } from '../security/security.module';
import { BillingController } from './billing.controller';
import { BillingWebhookController } from './billing-webhook.controller';
import { LimitsGuard } from './guards/limits.guard';
import { PlatformAdminController } from './platform-admin.controller';
import { SaasRepository } from './saas.repository';
import { SaasService } from './saas.service';

@Module({
  imports: [SecurityModule, PlatformModule],
  controllers: [BillingController, BillingWebhookController, PlatformAdminController],
  providers: [SaasService, SaasRepository, LimitsGuard],
  exports: [SaasService, SaasRepository, LimitsGuard],
})
export class SaasModule {}
