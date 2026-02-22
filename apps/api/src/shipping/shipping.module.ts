import { Module } from '@nestjs/common';
import { SecurityModule } from '../security/security.module';
import { ShippingController } from './shipping.controller';
import { ShippingRepository } from './shipping.repository';
import { ShippingService } from './shipping.service';

@Module({
  imports: [SecurityModule],
  controllers: [ShippingController],
  providers: [ShippingService, ShippingRepository],
  exports: [ShippingService, ShippingRepository],
})
export class ShippingModule {}
