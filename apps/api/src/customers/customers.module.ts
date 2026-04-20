import { forwardRef, Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersManagementController } from './customers-management.controller';
import { CustomersRepository } from './customers.repository';
import { CustomersService } from './customers.service';
import { CustomerAccessTokenGuard } from './guards/customer-access-token.guard';
import { StorefrontModule } from '../storefront/storefront.module';
import { CustomersEngagementController } from './customers-engagement.controller';
import { CustomersEngagementManagementController } from './customers-engagement-management.controller';
import { CustomerEngagementService } from './customer-engagement.service';
import { CustomerEngagementRepository } from './customer-engagement.repository';

@Module({
  imports: [forwardRef(() => StorefrontModule)],
  controllers: [
    CustomersController,
    CustomersManagementController,
    CustomersEngagementController,
    CustomersEngagementManagementController,
  ],
  providers: [
    CustomersService,
    CustomersRepository,
    CustomerAccessTokenGuard,
    CustomerEngagementService,
    CustomerEngagementRepository,
  ],
  exports: [
    CustomersService,
    CustomersRepository,
    CustomerAccessTokenGuard,
    CustomerEngagementService,
    CustomerEngagementRepository,
  ],
})
export class CustomersModule {}
