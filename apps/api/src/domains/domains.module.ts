import { Module } from '@nestjs/common';
import { SaasModule } from '../saas/saas.module';
import { SecurityModule } from '../security/security.module';
import { DnsResolverService } from './dns-resolver.service';
import { DomainsController } from './domains.controller';
import { DomainsRepository } from './domains.repository';
import { DomainsService } from './domains.service';

@Module({
  imports: [SecurityModule, SaasModule],
  controllers: [DomainsController],
  providers: [DomainsService, DomainsRepository, DnsResolverService],
  exports: [DomainsService, DomainsRepository, DnsResolverService],
})
export class DomainsModule {}
