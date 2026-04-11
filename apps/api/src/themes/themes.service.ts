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
    const normalizedConfig = validateThemeConfig(input.config);
    await this.getOrCreateTheme(currentUser.storeId);
    const updated = await this.themesRepository.updateDraft(currentUser.storeId, normalizedConfig);
    await this.logAudit('themes.draft_updated', currentUser, context, { version: updated.version });
    return this.toStateResponse(updated);
  }

  async publish(currentUser: AuthUser, context: RequestContextData): Promise<ThemeStateResponse> {
    const current = await this.getOrCreateTheme(currentUser.storeId);
    const normalizedDraft = validateThemeConfig(current.draft_config);
    await this.themesRepository.updateDraft(currentUser.storeId, normalizedDraft);

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
      const publishedConfig = this.safeConfig(theme.published_config);
      return {
        storeId,
        mode: 'published',
        version: theme.version,
        config: publishedConfig,
      };
    }

    const validToken = await this.themesRepository.findValidPreviewToken(previewToken);
    if (!validToken || validToken.store_id !== storeId) {
      throw new NotFoundException('Preview token is invalid or expired');
    }

    const draftConfig = this.safeConfig(theme.draft_config);

    return {
      storeId,
      mode: 'preview',
      version: theme.version,
      config: draftConfig,
    };
  }

  private safeConfig(config: Record<string, unknown>): Record<string, unknown> {
    try {
      return validateThemeConfig(config);
    } catch {
      return this.buildDefaultThemeConfig();
    }
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
      schemaVersion: 2,
      globals: {
        color: {
          bg: '#f4efe7',
          surface: '#fff9f0',
          text: '#2f2418',
          textMuted: '#6d5b46',
          primary: '#1f4f46',
          accent: '#c86f31',
          danger: '#b23a2f',
        },
        typography: {
          bodyFontFamily: 'Tajawal, Cairo, sans-serif',
          headingFontFamily: 'Lora, serif',
          baseFontSize: 16,
        },
        radius: {
          sm: 10,
          md: 14,
          lg: 22,
        },
        spacing: {
          unit: 8,
        },
        motion: {
          enabled: true,
          durationFast: 140,
          durationBase: 260,
        },
      },
      layout: {
        contentMaxWidth: 1120,
        headerSticky: true,
      },
      sections: [
        {
          id: 'announcement-main',
          type: 'announcement_bar',
          enabled: true,
          variant: 'default',
          settings: { message: 'Free shipping for orders above 300 SAR' },
        },
        { id: 'header-main', type: 'header', enabled: true, variant: 'default', settings: { sticky: true } },
        {
          id: 'hero-main',
          type: 'hero',
          enabled: true,
          variant: 'spotlight',
          settings: {
            headline: 'Welcome to Kaleem Store',
            subheadline: 'Fast mobile-first shopping experience with secure checkout.',
            primaryCtaLabel: 'Browse products',
            primaryCtaHref: '/categories',
          },
        },
        { id: 'categories-main', type: 'categories_grid', enabled: true, variant: 'grid', settings: {} },
        {
          id: 'featured-main',
          type: 'featured_products',
          enabled: true,
          variant: 'cards',
          settings: { limit: 8 },
        },
        {
          id: 'rich-text-main',
          type: 'rich_text',
          enabled: true,
          variant: 'highlight',
          settings: { title: 'Why customers trust us', body: 'Fast delivery, curated products, and secure checkout.' },
        },
        {
          id: 'testimonials-main',
          type: 'testimonials',
          enabled: true,
          variant: 'cards',
          settings: {
            title: 'Loved by shoppers',
          },
          blocks: [
            {
              id: 'testimonial-1',
              type: 'testimonial_item',
              settings: { quote: 'Great quality and fast support.', author: 'Reem' },
            },
            {
              id: 'testimonial-2',
              type: 'testimonial_item',
              settings: { quote: 'Checkout was smooth on mobile.', author: 'Faisal' },
            },
          ],
        },
        {
          id: 'newsletter-main',
          type: 'newsletter_signup',
          enabled: true,
          variant: 'default',
          settings: { title: 'Get weekly deals', ctaLabel: 'Subscribe' },
        },
        { id: 'offers-main', type: 'offers_banner', enabled: true, variant: 'default', settings: {} },
        {
          id: 'faq-main',
          type: 'faq',
          enabled: true,
          variant: 'list',
          settings: { title: 'Frequently asked questions' },
          blocks: [
            {
              id: 'faq-1',
              type: 'faq_item',
              settings: { question: 'How long does shipping take?', answer: 'Usually within 24-72 hours.' },
            },
            {
              id: 'faq-2',
              type: 'faq_item',
              settings: { question: 'Can I return items?', answer: 'Yes, according to our return policy.' },
            },
          ],
        },
        {
          id: 'trust-main',
          type: 'trust_badges',
          enabled: true,
          variant: 'inline',
          settings: { title: 'Why choose us' },
          blocks: [
            {
              id: 'trust-1',
              type: 'trust_badge',
              settings: { label: 'Secure Payment', description: 'Trusted payment methods and secure checkout.' },
            },
            {
              id: 'trust-2',
              type: 'trust_badge',
              settings: { label: 'Fast Delivery', description: 'Quick shipping with live order tracking.' },
            },
          ],
        },
        { id: 'footer-main', type: 'footer', enabled: true, variant: 'default', settings: {} },
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
      draftConfig: this.safeConfig(theme.draft_config),
      publishedConfig: this.safeConfig(theme.published_config),
    };
  }
}
