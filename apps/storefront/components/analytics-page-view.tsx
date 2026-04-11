'use client';

import { useEffect } from 'react';
import {
  type StorefrontAnalyticsEventName,
  trackStorefrontEvent,
} from '../lib/storefront-analytics';

export function AnalyticsPageView({
  eventName,
  metadata,
}: {
  eventName: StorefrontAnalyticsEventName;
  metadata?: Record<string, unknown>;
}) {
  useEffect(() => {
    trackStorefrontEvent(eventName, {
      ...(metadata ? { metadata } : {}),
    }).catch(() => undefined);
  }, [eventName, metadata]);

  return null;
}
