'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { saveRestockTokenToStorage } from '../lib/restock-token-storage';

export function RestockTokenCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('rst');
    if (!token) {
      return;
    }

    saveRestockTokenToStorage(token);
  }, [searchParams]);

  return null;
}
