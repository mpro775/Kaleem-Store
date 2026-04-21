'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCustomerAuth } from '../lib/customer-auth-context';
import * as client from '../lib/customer-client';
import type {
  CustomerProfile,
  CustomerAddress,
  ProductReview,
  WishlistItem,
  CustomerOrder,
  CustomerLoyaltyWallet,
  CustomerLoyaltyLedgerEntry,
} from '../lib/customer-client';

type AccountTab = 'profile' | 'addresses' | 'wishlist' | 'reviews' | 'orders' | 'loyalty';

export function AccountPageClient() {
  const { customer, isLoading, isAuthenticated, logout } = useCustomerAuth();
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile state
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', email: '' });

  // Addresses state
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    addressLine: '',
    city: '',
    area: '',
    notes: '',
    isDefault: false,
  });

  // Wishlist state
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  // Orders state
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [loyaltyWallet, setLoyaltyWallet] = useState<CustomerLoyaltyWallet | null>(null);
  const [loyaltyLedger, setLoyaltyLedger] = useState<CustomerLoyaltyLedgerEntry[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, activeTab]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case 'profile': {
          const p = await client.getCustomerProfile();
          setProfile(p);
          setProfileForm({ fullName: p.fullName, phone: p.phone, email: p.email ?? '' });
          break;
        }
        case 'addresses': {
          const a = await client.listCustomerAddresses();
          setAddresses(a);
          break;
        }
        case 'wishlist': {
          const w = await client.listWishlist();
          setWishlist(w);
          break;
        }
        case 'reviews': {
          const r = await client.listMyReviews();
          setReviews(r);
          break;
        }
        case 'orders': {
          const o = await client.listCustomerOrders();
          setOrders(o.orders);
          setOrdersTotal(o.total);
          break;
        }
        case 'loyalty': {
          const [wallet, ledger] = await Promise.all([
            client.getCustomerLoyaltyWallet(),
            client.listCustomerLoyaltyLedger(),
          ]);
          setLoyaltyWallet(wallet);
          setLoyaltyLedger(ledger);
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ظپط´ظ„ طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const updateInput: { fullName?: string; phone?: string; email?: string } = {
        fullName: profileForm.fullName,
        phone: profileForm.phone,
      };
      if (profileForm.email) {
        updateInput.email = profileForm.email;
      }
      const updated = await client.updateCustomerProfile(updateInput);
      setProfile(updated);
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ظپط´ظ„ طھط­ط¯ظٹط« ط§ظ„ظ…ظ„ظپ ط§ظ„ط´ط®طµظٹ');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const newAddress = await client.createCustomerAddress(addressForm);
      setAddresses([newAddress, ...addresses]);
      setShowAddAddress(false);
      setAddressForm({ addressLine: '', city: '', area: '', notes: '', isDefault: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ظپط´ظ„ ط¥ط¶ط§ظپط© ط§ظ„ط¹ظ†ظˆط§ظ†');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAddress(addressId: string) {
    if (!confirm('ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ط¹ظ†ظˆط§ظ†طں')) return;
    setError(null);
    try {
      await client.deleteCustomerAddress(addressId);
      setAddresses(addresses.filter((a) => a.id !== addressId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ظپط´ظ„ ط­ط°ظپ ط§ظ„ط¹ظ†ظˆط§ظ†');
    }
  }

  async function handleRemoveFromWishlist(productId: string) {
    setError(null);
    try {
      await client.removeFromWishlist(productId);
      setWishlist(wishlist.filter((w) => w.productId !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ظپط´ظ„ ط¥ط²ط§ظ„ط© ط§ظ„ظ…ظ†طھط¬ ظ…ظ† ط§ظ„ظ…ظپط¶ظ„ط©');
    }
  }

  async function handleDeleteReview(reviewId: string) {
    if (!confirm('ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„طھظ‚ظٹظٹظ…طں')) return;
    setError(null);
    try {
      await client.deleteReview(reviewId);
      setReviews(reviews.filter((r) => r.id !== reviewId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ظپط´ظ„ ط­ط°ظپ ط§ظ„طھظ‚ظٹظٹظ…');
    }
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <div className="panel">ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="page-shell">
        <div className="panel">
          <h2>ظٹط±ط¬ظ‰ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„</h2>
          <p>ظٹط¬ط¨ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ„ط¹ط±ط¶ ط­ط³ط§ط¨ظƒ</p>
          <Link href="/" className="button-primary">ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ط±ط¦ظٹط³ظٹط©</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>ط­ط³ط§ط¨ظٹ</h1>
        <p>ظ…ط±ط­ط¨ط§ظ‹ {customer?.fullName}! ط¥ط¯ط§ط±ط© ط­ط³ط§ط¨ظƒ ظˆط·ظ„ط¨ط§طھظƒ</p>
      </header>

      <nav className="account-tabs">
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          ط§ظ„ظ…ظ„ظپ ط§ظ„ط´ط®طµظٹ
        </button>
        <button
          className={`tab ${activeTab === 'addresses' ? 'active' : ''}`}
          onClick={() => setActiveTab('addresses')}
        >
          ط§ظ„ط¹ظ†ط§ظˆظٹظ†
        </button>
        <button
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          ط§ظ„ط·ظ„ط¨ط§طھ
        </button>
        <button
          className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('wishlist')}
        >
          ط§ظ„ظ…ظپط¶ظ„ط©
        </button>
        <button
          className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          ط§ظ„طھظ‚ظٹظٹظ…ط§طھ
        </button>
        <button
          className={`tab ${activeTab === 'loyalty' ? 'active' : ''}`}
          onClick={() => setActiveTab('loyalty')}
        >
          نقاطي
        </button>
      </nav>

      {error && <p className="error-message" style={{ marginTop: '1rem' }}>{error}</p>}

      <div className="account-content">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="section">
            <h3>ط§ظ„ظ…ظ„ظپ ط§ظ„ط´ط®طµظٹ</h3>
            {loading ? (
              <p>ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</p>
            ) : editMode ? (
              <form onSubmit={handleUpdateProfile} className="auth-form" style={{ marginTop: '1rem' }}>
                <div className="auth-field">
                  <label htmlFor="profile-name">ط§ظ„ط§ط³ظ… ط§ظ„ظƒط§ظ…ظ„</label>
                  <input
                    id="profile-name"
                    type="text"
                    className="input"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="profile-phone">ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ</label>
                  <input
                    id="profile-phone"
                    type="tel"
                    className="input"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="profile-email">ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ</label>
                  <input
                    id="profile-email"
                    type="email"
                    className="input"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="button-primary" disabled={loading}>
                    {loading ? 'ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸...' : 'ط­ظپط¸'}
                  </button>
                  <button type="button" className="button-secondary" onClick={() => setEditMode(false)}>
                    ط¥ظ„ط؛ط§ط،
                  </button>
                </div>
              </form>
            ) : profile ? (
              <div style={{ marginTop: '1rem' }} className="stack-md">
                <p><strong>ط§ظ„ط§ط³ظ…:</strong> {profile.fullName}</p>
                <p><strong>ط§ظ„ظ‡ط§طھظپ:</strong> {profile.phone}</p>
                <p><strong>ط§ظ„ط¨ط±ظٹط¯:</strong> {profile.email ?? 'ط؛ظٹط± ظ…ط­ط¯ط¯'}</p>
                <p><strong>طھط§ط±ظٹط® ط§ظ„ط§ظ†ط¶ظ…ط§ظ…:</strong> {new Date(profile.createdAt).toLocaleDateString('ar')}</p>
                <button className="button-secondary" onClick={() => setEditMode(true)}>
                  طھط¹ط¯ظٹظ„
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>ط§ظ„ط¹ظ†ط§ظˆظٹظ†</h3>
              <button className="button-primary" onClick={() => setShowAddAddress(!showAddAddress)}>
                {showAddAddress ? 'ط¥ظ„ط؛ط§ط،' : 'ط¥ط¶ط§ظپط© ط¹ظ†ظˆط§ظ†'}
              </button>
            </div>

            {showAddAddress && (
              <form onSubmit={handleAddAddress} className="auth-form" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
                <div className="auth-field">
                  <label htmlFor="addr-line">ط§ظ„ط¹ظ†ظˆط§ظ†</label>
                  <input
                    id="addr-line"
                    type="text"
                    className="input"
                    value={addressForm.addressLine}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="addr-city">ط§ظ„ظ…ط¯ظٹظ†ط©</label>
                  <input
                    id="addr-city"
                    type="text"
                    className="input"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="addr-area">ط§ظ„ظ…ظ†ط·ظ‚ط©</label>
                  <input
                    id="addr-area"
                    type="text"
                    className="input"
                    value={addressForm.area}
                    onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="addr-notes">ظ…ظ„ط§ط­ط¸ط§طھ</label>
                  <textarea
                    id="addr-notes"
                    className="input"
                    value={addressForm.notes}
                    onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  />
                  ط¬ط¹ظ„ظ‡ ط§ظ„ط¹ظ†ظˆط§ظ† ط§ظ„ط§ظپطھط±ط§ط¶ظٹ
                </label>
                <button type="submit" className="button-primary" disabled={loading}>
                  {loading ? 'ط¬ط§ط±ظٹ ط§ظ„ط¥ط¶ط§ظپط©...' : 'ط¥ط¶ط§ظپط© ط§ظ„ط¹ظ†ظˆط§ظ†'}
                </button>
              </form>
            )}

            <div className="stack-md" style={{ marginTop: '1rem' }}>
              {loading ? (
                <p>ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</p>
              ) : addresses.length === 0 ? (
                <p className="muted">ظ„ط§ طھظˆط¬ط¯ ط¹ظ†ط§ظˆظٹظ† ظ…ط­ظپظˆط¸ط©</p>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="address-card">
                    <div>
                      <p><strong>{addr.addressLine}</strong></p>
                      {addr.city && <p>{addr.city}{addr.area && ` - ${addr.area}`}</p>}
                      {addr.notes && <p className="muted">{addr.notes}</p>}
                      {addr.isDefault && <span className="badge">ط§ظپطھط±ط§ط¶ظٹ</span>}
                    </div>
                    <button
                      className="button-secondary"
                      onClick={() => handleDeleteAddress(addr.id)}
                      style={{ color: 'var(--danger)' }}
                    >
                      ط­ط°ظپ
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <div className="section">
            <h3>ط§ظ„ظ…ظپط¶ظ„ط©</h3>
            <div className="stack-md" style={{ marginTop: '1rem' }}>
              {loading ? (
                <p>ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</p>
              ) : wishlist.length === 0 ? (
                <p className="muted">ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ ظپظٹ ط§ظ„ظ…ظپط¶ظ„ط©</p>
              ) : (
                wishlist.map((item) => (
                  <div key={item.id} className="wishlist-card">
                    <div className="wishlist-info">
                      {item.primaryImageUrl && (
                        <img src={item.primaryImageUrl} alt={item.title} className="wishlist-thumb" />
                      )}
                      <div>
                        <Link href={`/products/${item.slug}`} style={{ fontWeight: 600 }}>
                          {item.title}
                        </Link>
                        {item.priceFrom !== null && (
                          <p className="muted">{item.priceFrom.toLocaleString('ar')} ط±.ظٹ</p>
                        )}
                      </div>
                    </div>
                    <button
                      className="button-secondary"
                      onClick={() => handleRemoveFromWishlist(item.productId)}
                      style={{ color: 'var(--danger)' }}
                    >
                      ط¥ط²ط§ظ„ط©
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="section">
            <h3>طھظ‚ظٹظٹظ…ط§طھظٹ</h3>
            <div className="stack-md" style={{ marginTop: '1rem' }}>
              {loading ? (
                <p>ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</p>
              ) : reviews.length === 0 ? (
                <p className="muted">ظ„ظ… طھظ‚ظ… ط¨ط¥ط¶ط§ظپط© ط£ظٹ طھظ‚ظٹظٹظ…ط§طھ ط¨ط¹ط¯</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <div className="review-rating">
                        {'âک…'.repeat(review.rating)}{'âک†'.repeat(5 - review.rating)}
                      </div>
                      {review.isVerifiedPurchase && (
                        <span className="badge">ط´ط±ط§ط، ظ…ظˆط«ظ‚</span>
                      )}
                    </div>
                    <p className="muted">
                      {review.productTitle || `Product #${review.productId}`}
                    </p>
                    {review.comment && <p style={{ margin: '0.5rem 0' }}>{review.comment}</p>}
                    <p className="muted" style={{ fontSize: '0.8rem' }}>
                      {new Date(review.createdAt).toLocaleDateString('ar')}
                    </p>
                    <button
                      className="button-secondary"
                      onClick={() => handleDeleteReview(review.id)}
                      style={{ color: 'var(--danger)', marginTop: '0.5rem' }}
                    >
                      ط­ط°ظپ ط§ظ„طھظ‚ظٹظٹظ…
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="section">
            <h3>ط·ظ„ط¨ط§طھظٹ ({ordersTotal})</h3>
            <div className="stack-md" style={{ marginTop: '1rem' }}>
              {loading ? (
                <p>ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</p>
              ) : orders.length === 0 ? (
                <p className="muted">ظ„ط§ طھظˆط¬ط¯ ط·ظ„ط¨ط§طھ ط³ط§ط¨ظ‚ط©</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div>
                        <strong>ط·ظ„ط¨ #{order.orderCode}</strong>
                        <span className={`order-status status-${order.status}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <span className="muted">
                        {new Date(order.createdAt).toLocaleDateString('ar')}
                      </span>
                    </div>
                    <div className="order-details">
                      <div className="order-row">
                        <span>ط§ظ„ظ…ط¬ظ…ظˆط¹ ط§ظ„ظپط±ط¹ظٹ</span>
                        <span>{order.subtotal.toFixed(2)} {order.currencyCode}</span>
                      </div>
                      <div className="order-row">
                        <span>ط§ظ„ط´ط­ظ†</span>
                        <span>{order.shippingFee.toFixed(2)} {order.currencyCode}</span>
                      </div>
                      {order.discountTotal > 0 && (
                        <div className="order-row">
                          <span>ط§ظ„ط®طµظ…</span>
                          <span className="discount">-{order.discountTotal.toFixed(2)} {order.currencyCode}</span>
                        </div>
                      )}
                      <div className="order-row total">
                        <span>ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ</span>
                        <strong>{order.total.toFixed(2)} {order.currencyCode}</strong>
                      </div>
                    </div>
                    <Link
                      href={`/track-order?orderCode=${encodeURIComponent(order.orderCode)}`}
                      className="button-secondary"
                    >
                      طھطھط¨ط¹ ط§ظ„ط·ظ„ط¨
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'loyalty' && (
          <div className="section">
            <h3>نقاط الولاء</h3>
            {loading ? (
              <p>جاري التحميل...</p>
            ) : (
              <div className="stack-md" style={{ marginTop: '1rem' }}>
                {loyaltyWallet ? (
                  <div className="panel">
                    <p><strong>الرصيد المتاح:</strong> {loyaltyWallet.availablePoints}</p>
                    <p><strong>المكتسبة:</strong> {loyaltyWallet.lifetimeEarnedPoints}</p>
                    <p><strong>المصروفة:</strong> {loyaltyWallet.lifetimeRedeemedPoints}</p>
                  </div>
                ) : null}
                <div className="panel">
                  <h4>آخر الحركات</h4>
                  {loyaltyLedger.length === 0 ? (
                    <p className="muted">لا توجد حركات نقاط حتى الآن</p>
                  ) : (
                    loyaltyLedger.slice(0, 20).map((entry) => (
                      <div key={entry.id} className="order-row">
                        <span>{entry.entryType}</span>
                        <span>{entry.pointsDelta}</span>
                        <span>{new Date(entry.createdAt).toLocaleDateString('ar')}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button
          className="button-secondary"
          onClick={async () => { await logout(); }}
          style={{ color: 'var(--danger)' }}
        >
          طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬
        </button>
      </div>
    </main>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'ظ‚ظٹط¯ ط§ظ„ط§ظ†طھط¸ط§ط±',
    confirmed: 'ظ…ط¤ظƒط¯',
    processing: 'ظ‚ظٹط¯ ط§ظ„ظ…ط¹ط§ظ„ط¬ط©',
    shipped: 'طھظ… ط§ظ„ط´ط­ظ†',
    delivered: 'طھظ… ط§ظ„طھظˆطµظٹظ„',
    completed: 'ظ…ظƒطھظ…ظ„',
    cancelled: 'ظ…ظ„ط؛ظٹ',
    refunded: 'ظ…ط³طھط±ط¬ط¹',
  };
  return labels[status] ?? status;
}



