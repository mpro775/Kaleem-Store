import { Module } from '@nestjs/common';
import { AttributesModule } from '../attributes/attributes.module';
import { CategoriesModule } from '../categories/categories.module';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OrdersModule } from '../orders/orders.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { ProductsModule } from '../products/products.module';
import { SaasModule } from '../saas/saas.module';
import { ShippingModule } from '../shipping/shipping.module';
import { StoresModule } from '../stores/stores.module';
import { ThemesModule } from '../themes/themes.module';
import { PublicStoreController } from './public-store.controller';
import { StoreResolverService } from './store-resolver.service';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';

@Module({
  imports: [
    StoresModule,
    CategoriesModule,
    AttributesModule,
    ProductsModule,
    OrdersModule,
    InventoryModule,
    ShippingModule,
    PromotionsModule,
    ThemesModule,
    SaasModule,
    IdempotencyModule,
  ],
  controllers: [StorefrontController, PublicStoreController],
  providers: [StorefrontService, StoreResolverService],
  exports: [StoreResolverService],
})
export class StorefrontModule {}
