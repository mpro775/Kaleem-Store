'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useCustomerAuth } from './customer-auth-context';
import * as customerClient from './customer-client';

interface WishlistContextType {
  wishlistProductIds: Set<string>;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useCustomerAuth();
  const [wishlistProductIds, setWishlistProductIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistProductIds(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const items = await customerClient.listWishlist();
      setWishlistProductIds(new Set(items.map((item) => item.productId)));
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const isInWishlist = useCallback(
    (productId: string) => wishlistProductIds.has(productId),
    [wishlistProductIds],
  );

  const toggleWishlist = useCallback(
    async (productId: string): Promise<boolean> => {
      if (!isAuthenticated) {
        return false;
      }

      const wasInWishlist = wishlistProductIds.has(productId);

      // Optimistic update
      setWishlistProductIds((prev) => {
        const next = new Set(prev);
        if (wasInWishlist) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return next;
      });

      try {
        if (wasInWishlist) {
          await customerClient.removeFromWishlist(productId);
        } else {
          await customerClient.addToWishlist(productId);
        }
        return !wasInWishlist;
      } catch {
        // Revert on error
        setWishlistProductIds((prev) => {
          const next = new Set(prev);
          if (wasInWishlist) {
            next.add(productId);
          } else {
            next.delete(productId);
          }
          return next;
        });
        return wasInWishlist;
      }
    },
    [isAuthenticated, wishlistProductIds],
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlistProductIds,
        isInWishlist,
        toggleWishlist,
        isLoading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
