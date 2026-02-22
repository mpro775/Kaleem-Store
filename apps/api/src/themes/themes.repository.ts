import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';

export interface StoreThemeRecord {
  id: string;
  store_id: string;
  draft_config: Record<string, unknown>;
  published_config: Record<string, unknown>;
  version: number;
}

export interface ThemePreviewTokenRecord {
  id: string;
  store_id: string;
  token: string;
  expires_at: Date;
}

@Injectable()
export class ThemesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByStoreId(storeId: string): Promise<StoreThemeRecord | null> {
    const result = await this.databaseService.db.query<StoreThemeRecord>(
      `
        SELECT id, store_id, draft_config, published_config, version
        FROM store_themes
        WHERE store_id = $1
        LIMIT 1
      `,
      [storeId],
    );
    return result.rows[0] ?? null;
  }

  async createDefaultTheme(
    storeId: string,
    config: Record<string, unknown>,
  ): Promise<StoreThemeRecord | null> {
    const result = await this.databaseService.db.query<StoreThemeRecord>(
      `
        INSERT INTO store_themes (
          id,
          store_id,
          draft_config,
          published_config,
          version
        ) VALUES ($1, $2, $3::jsonb, $3::jsonb, 1)
        ON CONFLICT (store_id) DO NOTHING
        RETURNING id, store_id, draft_config, published_config, version
      `,
      [uuidv4(), storeId, JSON.stringify(config)],
    );
    return result.rows[0] ?? null;
  }

  async updateDraft(storeId: string, config: Record<string, unknown>): Promise<StoreThemeRecord> {
    const result = await this.databaseService.db.query<StoreThemeRecord>(
      `
        UPDATE store_themes
        SET draft_config = $2::jsonb,
            updated_at = NOW()
        WHERE store_id = $1
        RETURNING id, store_id, draft_config, published_config, version
      `,
      [storeId, JSON.stringify(config)],
    );
    return result.rows[0] as StoreThemeRecord;
  }

  async publishDraft(storeId: string): Promise<StoreThemeRecord> {
    const result = await this.databaseService.db.query<StoreThemeRecord>(
      `
        UPDATE store_themes
        SET published_config = draft_config,
            version = version + 1,
            updated_at = NOW()
        WHERE store_id = $1
        RETURNING id, store_id, draft_config, published_config, version
      `,
      [storeId],
    );
    return result.rows[0] as StoreThemeRecord;
  }

  async createPreviewToken(storeId: string, token: string, expiresAt: Date): Promise<ThemePreviewTokenRecord> {
    const result = await this.databaseService.db.query<ThemePreviewTokenRecord>(
      `
        INSERT INTO theme_preview_tokens (
          id,
          store_id,
          token,
          expires_at
        ) VALUES ($1, $2, $3, $4)
        RETURNING id, store_id, token, expires_at
      `,
      [uuidv4(), storeId, token, expiresAt],
    );
    return result.rows[0] as ThemePreviewTokenRecord;
  }

  async findValidPreviewToken(token: string): Promise<ThemePreviewTokenRecord | null> {
    const result = await this.databaseService.db.query<ThemePreviewTokenRecord>(
      `
        SELECT id, store_id, token, expires_at
        FROM theme_preview_tokens
        WHERE token = $1
          AND expires_at > NOW()
        LIMIT 1
      `,
      [token],
    );
    return result.rows[0] ?? null;
  }

  async deleteExpiredPreviewTokens(): Promise<void> {
    await this.databaseService.db.query(
      `
        DELETE FROM theme_preview_tokens
        WHERE expires_at <= NOW()
      `,
    );
  }
}
