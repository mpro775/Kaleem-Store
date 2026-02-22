import { Module } from '@nestjs/common';
import { SecurityModule } from '../security/security.module';
import { StoresController } from './stores.controller';
import { StoresRepository } from './stores.repository';
import { StoresService } from './stores.service';

@Module({
  imports: [SecurityModule],
  controllers: [StoresController],
  providers: [StoresService, StoresRepository],
  exports: [StoresRepository, StoresService],
})
export class StoresModule {}
