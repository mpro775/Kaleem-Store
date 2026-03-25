import { forwardRef, Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersRepository } from './customers.repository';
import { CustomersService } from './customers.service';
import { CustomerAccessTokenGuard } from './guards/customer-access-token.guard';
import { StorefrontModule } from '../storefront/storefront.module';

@Module({
  imports: [forwardRef(() => StorefrontModule)],
  controllers: [CustomersController],
  providers: [CustomersService, CustomersRepository, CustomerAccessTokenGuard],
  exports: [CustomersService, CustomersRepository, CustomerAccessTokenGuard],
})
export class CustomersModule {}
