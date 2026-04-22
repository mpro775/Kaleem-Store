import { Module } from '@nestjs/common';
import { SecurityModule } from '../security/security.module';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformAuthRepository } from './platform-auth.repository';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformAccessTokenGuard } from './guards/platform-access-token.guard';
import { PlatformPermissionsGuard } from './guards/platform-permissions.guard';

@Module({
  imports: [SecurityModule],
  controllers: [PlatformAuthController],
  providers: [
    PlatformAuthRepository,
    PlatformAuthService,
    PlatformAccessTokenGuard,
    PlatformPermissionsGuard,
  ],
  exports: [
    PlatformAuthRepository,
    PlatformAuthService,
    PlatformAccessTokenGuard,
    PlatformPermissionsGuard,
  ],
})
export class PlatformModule {}
