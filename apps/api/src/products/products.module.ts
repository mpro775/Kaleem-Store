import { Module } from '@nestjs/common';
import { AttributesModule } from '../attributes/attributes.module';
import { CategoriesModule } from '../categories/categories.module';
import { SaasModule } from '../saas/saas.module';
import { SecurityModule } from '../security/security.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

@Module({
  imports: [
    SecurityModule,
    CategoriesModule,
    AttributesModule,
    SaasModule,
    WebhooksModule,
    WarehousesModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
