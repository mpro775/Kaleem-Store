import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SaasModule } from '../saas/saas.module';
import { SecurityModule } from '../security/security.module';
import { AuthStaffController, UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [SecurityModule, AuthModule, SaasModule],
  controllers: [UsersController, AuthStaffController],
  providers: [UsersService, UsersRepository],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
