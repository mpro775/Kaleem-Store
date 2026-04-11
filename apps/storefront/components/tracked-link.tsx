'use client';

import Link, { type LinkProps } from 'next/link';
import type { ReactNode } from 'react';
import { trackStorefrontEvent } from '../lib/storefront-analytics';

export function TrackedLink({
  children,
  eventLabel,
  className,
  ...props
}: LinkProps & {
  children: ReactNode;
  className?: string;
  eventLabel: string;
}) {
  return (
    <Link
      {...props}
      className={className}
      onClick={() => {
        trackStorefrontEvent('sf_section_clicked', {
          metadata: {
            label: eventLabel,
            href: typeof props.href === 'string' ? props.href : props.href.toString(),
          },
        }).catch(() => undefined);
      }}
    >
      {children}
    </Link>
  );
}
