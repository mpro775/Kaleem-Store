import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { SecurityModule } from '../security/security.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

@Module({
  imports: [SecurityModule, InventoryModule, WebhooksModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersRepository, OrdersService],
})
export class OrdersModule {}
