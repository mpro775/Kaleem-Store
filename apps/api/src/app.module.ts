import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { envValidationSchema } from './config/env.validation';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AuditModule } from './audit/audit.module';
import { AttributesModule } from './attributes/attributes.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { DatabaseModule } from './database/database.module';
import { DomainsModule } from './domains/domains.module';
import { EmailModule } from './email/email.module';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory/inventory.module';
import { MediaModule } from './media/media.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PromotionsModule } from './promotions/promotions.module';
import { ProductsModule } from './products/products.module';
import { SaasModule } from './saas/saas.module';
import { ShippingModule } from './shipping/shipping.module';
import { StoresModule } from './stores/stores.module';
import { StorefrontModule } from './storefront/storefront.module';
import { ThemesModule } from './themes/themes.module';
import { UsersModule } from './users/users.module';
import { ObservabilityModule } from './observability/observability.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AdvancedOffersModule } from './advanced-offers/advanced-offers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    EmailModule,
    ObservabilityModule,
    AuditModule,
    MessagingModule,
    NotificationsModule,
    HealthModule,
    AuthModule,
    StoresModule,
    UsersModule,
    CategoriesModule,
    AttributesModule,
    ProductsModule,
    SaasModule,
    MediaModule,
    ShippingModule,
    PromotionsModule,
    ThemesModule,
    DomainsModule,
    WebhooksModule,
    AdvancedOffersModule,
    InventoryModule,
    OrdersModule,
    PaymentsModule,
    StorefrontModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
