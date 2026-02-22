import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';

export interface AuditLogInput {
  storeId: string | null;
  storeUserId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly databaseService: DatabaseService) {}

  async log(input: AuditLogInput): Promise<void> {
    await this.databaseService.db.query(
      `
        INSERT INTO audit_logs (
          id,
          store_id,
          store_user_id,
          action,
          target_type,
          target_id,
          ip_address,
          user_agent,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        uuidv4(),
        input.storeId,
        input.storeUserId,
        input.action,
        input.targetType ?? null,
        input.targetId ?? null,
        input.ipAddress ?? null,
        input.userAgent ?? null,
        input.metadata ?? {},
      ],
    );
  }
}
