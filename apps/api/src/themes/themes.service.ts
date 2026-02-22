import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import type { RequestContextData } from '../common/utils/request-context.util';
import { OutboxService } from '../messaging/outbox.service';
import { validateThemeConfig } from './theme-config.validator';
import type { CreateThemePreviewTokenDto } from './dto/create-theme-preview-token.dto';
import type { UpdateThemeDraftDto } from './dto/update-theme-draft.dto';
import { ThemesRepository, type StoreThemeRecord } from './themes.repository';

export interface ThemeStateResponse {
  storeId: string;
  version: number;
  draftConfig: Record<string, unknown>;
  publishedConfig: Record<string, unknown>;
}

export interface ThemePreviewTokenResponse {
  previewToken: string;
  expiresAt: Date;
}

export interface StorefrontThemeResponse {
  storeId: string;
  mode: 'published' | 'preview';
  version: number;
  config: Record<string, unknown>;
}

@Injectable()
export class ThemesService {
  constructor(
    private readonly themesRepository: ThemesRepository,
    private readonly outboxService: OutboxService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  async getDraft(currentUser: AuthUser): Promise<ThemeStateResponse> {
    const theme = await this.getOrCreateTheme(currentUser.storeId);
    return this.toStateResponse(theme);
  }

  async updateDraft(
    currentUser: AuthUser,
    input: UpdateThemeDraftDto,
    context: RequestContextData,
  ): Promise<ThemeStateResponse> {
    validateThemeConfig(input.config);
    await this.getOrCreateTheme(currentUser.storeId);
    const updated = await this.themesRepository.updateDraft(currentUser.storeId, input.config);
    await this.logAudit('themes.draft_updated', currentUser, context, { version: updated.version });
    return this.toStateResponse(updated);
  }

  async publish(currentUser: AuthUser, context: RequestContextData): Promise<ThemeStateResponse> {
    const current = await this.getOrCreateTheme(currentUser.storeId);
    validateThemeConfig(current.draft_config);

    const published = await this.themesRepository.publishDraft(currentUser.storeId);
    await this.outboxService.enqueue({
      aggregateType: 'store_theme',
      aggregateId: published.id,
      eventType: 'theme.published',
      payload: {
        storeId: currentUser.storeId,
        version: published.version,
      },
    });

    await this.logAudit('themes.published', currentUser, context, {
      version: published.version,
    });

    return this.toStateResponse(published);
  }

  async createPreviewToken(
    currentUser: AuthUser,
    input: CreateThemePreviewTokenDto,
    context: RequestContextData,
  ): Promise<ThemePreviewTokenResponse> {
    await this.getOrCreateTheme(currentUser.storeId);
    await this.themesRepository.deleteExpiredPreviewTokens();

    const ttlMinutes = input.expiresInMinutes ?? this.configService.get<number>('THEME_PREVIEW_TOKEN_TTL_MINUTES', 30);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
    const previewToken = randomBytes(24).toString('hex');

    const token = await this.themesRepository.createPreviewToken(currentUser.storeId, previewToken, expiresAt);
    await this.logAudit('themes.preview_token_created', currentUser, context, {
      expiresAt: token.expires_at.toISOString(),
    });

    return {
      previewToken: token.token,
      expiresAt: token.expires_at,
    };
  }

  async getStorefrontTheme(storeId: string, previewToken?: string): Promise<StorefrontThemeResponse> {
    const theme = await this.getOrCreateTheme(storeId);
    if (!previewToken) {
      return {
        storeId,
        mode: 'published',
        version: theme.version,
        config: theme.published_config,
      };
    }

    const validToken = await this.themesRepository.findValidPreviewToken(previewToken);
    if (!validToken || validToken.store_id !== storeId) {
      throw new NotFoundException('Preview token is invalid or expired');
    }

    return {
      storeId,
      mode: 'preview',
      version: theme.version,
      config: theme.draft_config,
    };
  }

  private async getOrCreateTheme(storeId: string): Promise<StoreThemeRecord> {
    const existing = await this.themesRepository.findByStoreId(storeId);
    if (existing) {
      return existing;
    }

    const created = await this.themesRepository.createDefaultTheme(storeId, this.buildDefaultThemeConfig());
    if (created) {
      return created;
    }

    const fallback = await this.themesRepository.findByStoreId(storeId);
    if (!fallback) {
      throw new NotFoundException('Store theme not found');
    }
    return fallback;
  }

  private buildDefaultThemeConfig(): Record<string, unknown> {
    return {
      globals: {
        primaryColor: '#1f4f46',
        accentColor: '#c86f31',
        background: '#f4efe7',
        fontFamily: 'Lora, serif',
      },
      sections: [
        { id: 'header-main', type: 'header', enabled: true, settings: { sticky: true } },
        { id: 'hero-main', type: 'hero', enabled: true, settings: { headline: 'Welcome to Kaleem Store' } },
        { id: 'categories-main', type: 'categories_grid', enabled: true, settings: {} },
        { id: 'featured-main', type: 'featured_products', enabled: true, settings: { limit: 8 } },
        { id: 'offers-main', type: 'offers_banner', enabled: true, settings: {} },
        { id: 'footer-main', type: 'footer', enabled: true, settings: {} },
      ],
    };
  }

  private async logAudit(
    action: string,
    currentUser: AuthUser,
    context: RequestContextData,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.auditService.log({
      action,
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'store_theme',
      targetId: currentUser.storeId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        ...metadata,
        ...(context.requestId ? { requestId: context.requestId } : {}),
      },
    });
  }

  private toStateResponse(theme: StoreThemeRecord): ThemeStateResponse {
    return {
      storeId: theme.store_id,
      version: theme.version,
      draftConfig: theme.draft_config,
      publishedConfig: theme.published_config,
    };
  }
}
