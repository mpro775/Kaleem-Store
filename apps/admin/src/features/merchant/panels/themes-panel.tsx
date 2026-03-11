import { useState } from 'react';
import type { MerchantRequester } from '../merchant-dashboard';
import type { PreviewTokenResponse, ThemeState } from '../types';

interface ThemesPanelProps {
  request: MerchantRequester;
  apiBaseUrl: string;
}

const sectionKeys = [
  'announcement_bar',
  'header',
  'hero',
  'categories_grid',
  'featured_products',
  'rich_text',
  'testimonials',
  'newsletter_signup',
  'offers_banner',
  'footer',
] as const;

type SectionKey = (typeof sectionKeys)[number];

interface ThemeEditorForm {
  primaryColor: string;
  accentColor: string;
  background: string;
  fontFamily: string;
  heroHeadline: string;
  sectionEnabled: Record<SectionKey, boolean>;
}

const defaultForm: ThemeEditorForm = {
  primaryColor: '#1f4f46',
  accentColor: '#c86f31',
  background: '#f4efe7',
  fontFamily: 'Lora, serif',
  heroHeadline: 'Welcome to Kaleem Store',
  sectionEnabled: {
    announcement_bar: true,
    header: true,
    hero: true,
    categories_grid: true,
    featured_products: true,
    rich_text: true,
    testimonials: true,
    newsletter_signup: true,
    offers_banner: true,
    footer: true,
  },
};

export function ThemesPanel({ request, apiBaseUrl }: ThemesPanelProps) {
  const [themeState, setThemeState] = useState<ThemeState | null>(null);
  const [form, setForm] = useState<ThemeEditorForm>(defaultForm);
  const [message, setMessage] = useState('');
  const [previewToken, setPreviewToken] = useState<PreviewTokenResponse | null>(null);

  async function loadDraft(): Promise<void> {
    setMessage('');
    try {
      const data = await request<ThemeState>('/themes/draft', { method: 'GET' });
      if (!data) {
        return;
      }

      setThemeState(data);
      setForm(themeConfigToForm(data.draftConfig));
      setMessage('Theme draft loaded');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load theme draft');
    }
  }

  async function saveDraft(): Promise<void> {
    setMessage('');
    try {
      const data = await request<ThemeState>('/themes/draft', {
        method: 'PUT',
        body: JSON.stringify({ config: formToThemeConfig(form) }),
      });

      if (data) {
        setThemeState(data);
      }
      setMessage('Theme draft saved');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save theme draft');
    }
  }

  async function publishTheme(): Promise<void> {
    setMessage('');
    try {
      const data = await request<ThemeState>('/themes/publish', { method: 'POST' });
      if (data) {
        setThemeState(data);
      }
      setMessage('Theme published');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to publish theme');
    }
  }

  async function createPreviewToken(): Promise<void> {
    setMessage('');
    try {
      const token = await request<PreviewTokenResponse>('/themes/preview-token', {
        method: 'POST',
        body: JSON.stringify({ expiresInMinutes: 30 }),
      });
      setPreviewToken(token);
      setMessage('Preview token created');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create preview token');
    }
  }

  return (
    <article className="card">
      <h3>Themes</h3>
      <div className="actions">
        <button onClick={() => loadDraft().catch(() => undefined)}>Load Draft</button>
        <button onClick={() => saveDraft().catch(() => undefined)}>Save Draft</button>
        <button onClick={() => createPreviewToken().catch(() => undefined)}>Preview Token</button>
        <button className="primary" onClick={() => publishTheme().catch(() => undefined)}>
          Publish
        </button>
      </div>

      <label>
        Primary Color
        <input
          value={form.primaryColor}
          onChange={(event) => setForm((prev) => ({ ...prev, primaryColor: event.target.value }))}
        />
      </label>
      <label>
        Accent Color
        <input
          value={form.accentColor}
          onChange={(event) => setForm((prev) => ({ ...prev, accentColor: event.target.value }))}
        />
      </label>
      <label>
        Background Color
        <input
          value={form.background}
          onChange={(event) => setForm((prev) => ({ ...prev, background: event.target.value }))}
        />
      </label>
      <label>
        Font Family
        <input
          value={form.fontFamily}
          onChange={(event) => setForm((prev) => ({ ...prev, fontFamily: event.target.value }))}
        />
      </label>
      <label>
        Hero Headline
        <input
          value={form.heroHeadline}
          onChange={(event) => setForm((prev) => ({ ...prev, heroHeadline: event.target.value }))}
        />
      </label>

      <div className="inline-check-grid">
        {sectionKeys.map((key) => (
          <label key={key} className="inline-check">
            <input
              type="checkbox"
              checked={form.sectionEnabled[key]}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  sectionEnabled: {
                    ...prev.sectionEnabled,
                    [key]: event.target.checked,
                  },
                }))
              }
            />
            {key}
          </label>
        ))}
      </div>

      {themeState ? <p className="hint">Current published version: {themeState.version}</p> : null}
      {previewToken ? (
        <p className="hint">
          Preview URL:{' '}
          <code>{`${apiBaseUrl}/sf/theme?previewToken=${previewToken.previewToken}`}</code>
        </p>
      ) : null}
      {message ? <p className="status-message">{message}</p> : null}
    </article>
  );
}

function themeConfigToForm(config: Record<string, unknown>): ThemeEditorForm {
  const globals = asRecord(config.globals);
  const sections = Array.isArray(config.sections) ? config.sections : [];
  const sectionEnabled = { ...defaultForm.sectionEnabled };

  for (const section of sections) {
    const sectionRecord = asRecord(section);
    const type = sectionRecord.type;
    if (typeof type === 'string' && isSectionKey(type)) {
      sectionEnabled[type] = sectionRecord.enabled !== false;
    }
  }

  const heroHeadline = resolveHeroHeadline(sections);

  return {
    primaryColor:
      typeof globals.primaryColor === 'string' ? globals.primaryColor : defaultForm.primaryColor,
    accentColor:
      typeof globals.accentColor === 'string' ? globals.accentColor : defaultForm.accentColor,
    background:
      typeof globals.background === 'string' ? globals.background : defaultForm.background,
    fontFamily:
      typeof globals.fontFamily === 'string' ? globals.fontFamily : defaultForm.fontFamily,
    heroHeadline,
    sectionEnabled,
  };
}

function formToThemeConfig(form: ThemeEditorForm): Record<string, unknown> {
  return {
    globals: {
      primaryColor: form.primaryColor,
      accentColor: form.accentColor,
      background: form.background,
      fontFamily: form.fontFamily,
    },
    sections: [
      {
        id: 'announcement-main',
        type: 'announcement_bar',
        enabled: form.sectionEnabled.announcement_bar,
        settings: { message: 'Free shipping for orders above 300 SAR' },
      },
      {
        id: 'header-main',
        type: 'header',
        enabled: form.sectionEnabled.header,
        settings: { sticky: true },
      },
      {
        id: 'hero-main',
        type: 'hero',
        enabled: form.sectionEnabled.hero,
        settings: { headline: form.heroHeadline },
      },
      {
        id: 'categories-main',
        type: 'categories_grid',
        enabled: form.sectionEnabled.categories_grid,
        settings: {},
      },
      {
        id: 'featured-main',
        type: 'featured_products',
        enabled: form.sectionEnabled.featured_products,
        settings: { limit: 8 },
      },
      {
        id: 'rich-text-main',
        type: 'rich_text',
        enabled: form.sectionEnabled.rich_text,
        settings: {
          title: 'Why customers trust us',
          body: 'Fast delivery, curated products, and secure checkout.',
        },
      },
      {
        id: 'testimonials-main',
        type: 'testimonials',
        enabled: form.sectionEnabled.testimonials,
        settings: {
          title: 'Loved by shoppers',
          items: [
            { quote: 'Great quality and fast support.', author: 'Reem' },
            { quote: 'Checkout was smooth on mobile.', author: 'Faisal' },
          ],
        },
      },
      {
        id: 'newsletter-main',
        type: 'newsletter_signup',
        enabled: form.sectionEnabled.newsletter_signup,
        settings: { title: 'Get weekly deals', ctaLabel: 'Subscribe' },
      },
      {
        id: 'offers-main',
        type: 'offers_banner',
        enabled: form.sectionEnabled.offers_banner,
        settings: {},
      },
      {
        id: 'footer-main',
        type: 'footer',
        enabled: form.sectionEnabled.footer,
        settings: {},
      },
    ],
  };
}

function resolveHeroHeadline(sections: unknown[]): string {
  for (const section of sections) {
    const sectionRecord = asRecord(section);
    if (sectionRecord.type !== 'hero') {
      continue;
    }

    const settings = asRecord(sectionRecord.settings);
    if (typeof settings.headline === 'string') {
      return settings.headline;
    }
  }

  return defaultForm.heroHeadline;
}

function isSectionKey(value: string): value is SectionKey {
  return sectionKeys.includes(value as SectionKey);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
