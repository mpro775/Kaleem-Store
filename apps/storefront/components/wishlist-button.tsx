'use client';

import { useWishlist } from '../lib/wishlist-context';
import { useCustomerAuth } from '../lib/customer-auth-context';
import { useState } from 'react';
import { AuthModal } from './auth-modal';

interface WishlistButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function WishlistButton({ productId, size = 'md' }: WishlistButtonProps) {
  const { isAuthenticated } = useCustomerAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const inWishlist = isInWishlist(productId);

  async function handleClick() {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setBusy(true);
    try {
      await toggleWishlist(productId);
    } finally {
      setBusy(false);
    }
  }

  const sizeClass = {
    sm: 'wishlist-btn-sm',
    md: 'wishlist-btn-md',
    lg: 'wishlist-btn-lg',
  }[size];

  return (
    <>
      <button
        className={`wishlist-btn ${sizeClass} ${inWishlist ? 'active' : ''}`}
        onClick={handleClick}
        disabled={busy}
        title={inWishlist ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        aria-label={inWishlist ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
      >
        <svg
          width={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
          height={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
          viewBox="0 0 24 24"
          fill={inWishlist ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {size !== 'sm' && (
          <span>{inWishlist ? 'في المفضلة' : 'أضف للمفضلة'}</span>
        )}
      </button>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
