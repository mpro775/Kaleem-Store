'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCustomerAuth } from '../lib/customer-auth-context';
import { AuthModal } from './auth-modal';

export function HeaderAuth() {
  const { customer, isLoading, isAuthenticated, logout } = useCustomerAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <>
        <button
          className="header-auth-button"
          onClick={() => setShowAuthModal(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          تسجيل الدخول
        </button>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  return (
    <div className="user-menu-wrapper">
      <button
        className="user-menu-trigger"
        onClick={() => setShowMenu(!showMenu)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        {customer?.fullName}
      </button>
      {showMenu && (
        <div className="user-menu-dropdown">
          <Link href="/account" className="user-menu-item" onClick={() => setShowMenu(false)}>
            حسابي
          </Link>
          <button
            className="user-menu-item danger"
            onClick={async () => {
              await logout();
              setShowMenu(false);
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      )}
    </div>
  );
}
