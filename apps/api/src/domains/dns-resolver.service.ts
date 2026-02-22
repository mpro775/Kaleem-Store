import { Injectable } from '@nestjs/common';
import { resolveTxt } from 'node:dns/promises';

@Injectable()
export class DnsResolverService {
  async hasVerificationRecord(hostname: string, token: string, prefix: string): Promise<boolean> {
    const recordHost = `${prefix}.${hostname}`;

    try {
      const records = await resolveTxt(recordHost);
      const values = records.map((parts) => parts.join('').trim());
      return values.includes(token);
    } catch (error) {
      if (this.isDnsNotFound(error)) {
        return false;
      }
      throw error;
    }
  }

  private isDnsNotFound(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const dnsError = error as Error & { code?: string };
    return dnsError.code === 'ENOTFOUND' || dnsError.code === 'ENODATA';
  }
}
