import { Module } from '@nestjs/common';
import { SecurityModule } from '../security/security.module';
import { BillingController } from './billing.controller';
import { LimitsGuard } from './guards/limits.guard';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformAdminGuard } from './platform-admin.guard';
import { SaasRepository } from './saas.repository';
import { SaasService } from './saas.service';

@Module({
  imports: [SecurityModule],
  controllers: [BillingController, PlatformAdminController],
  providers: [SaasService, SaasRepository, PlatformAdminGuard, LimitsGuard],
  exports: [SaasService, SaasRepository, LimitsGuard],
})
export class SaasModule {}
