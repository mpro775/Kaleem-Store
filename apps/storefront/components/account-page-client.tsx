'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCustomerAuth } from '../lib/customer-auth-context';
import * as client from '../lib/customer-client';
import type { CustomerProfile, CustomerAddress, ProductReview, WishlistItem, CustomerOrder } from '../lib/customer-client';

type AccountTab = 'profile' | 'addresses' | 'wishlist' | 'reviews' | 'orders';

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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل البيانات');
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
      setError(err instanceof Error ? err.message : 'فشل تحديث الملف الشخصي');
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
      setError(err instanceof Error ? err.message : 'فشل إضافة العنوان');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAddress(addressId: string) {
    if (!confirm('هل أنت متأكد من حذف هذا العنوان؟')) return;
    setError(null);
    try {
      await client.deleteCustomerAddress(addressId);
      setAddresses(addresses.filter((a) => a.id !== addressId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف العنوان');
    }
  }

  async function handleRemoveFromWishlist(productId: string) {
    setError(null);
    try {
      await client.removeFromWishlist(productId);
      setWishlist(wishlist.filter((w) => w.productId !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إزالة المنتج من المفضلة');
    }
  }

  async function handleDeleteReview(reviewId: string) {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
    setError(null);
    try {
      await client.deleteReview(reviewId);
      setReviews(reviews.filter((r) => r.id !== reviewId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف التقييم');
    }
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <div className="panel">جاري التحميل...</div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="page-shell">
        <div className="panel">
          <h2>يرجى تسجيل الدخول</h2>
          <p>يجب تسجيل الدخول لعرض حسابك</p>
          <Link href="/" className="button-primary">العودة للرئيسية</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>حسابي</h1>
        <p>مرحباً {customer?.fullName}! إدارة حسابك وطلباتك</p>
      </header>

      <nav className="account-tabs">
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          الملف الشخصي
        </button>
        <button
          className={`tab ${activeTab === 'addresses' ? 'active' : ''}`}
          onClick={() => setActiveTab('addresses')}
        >
          العناوين
        </button>
        <button
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          الطلبات
        </button>
        <button
          className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('wishlist')}
        >
          المفضلة
        </button>
        <button
          className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          التقييمات
        </button>
      </nav>

      {error && <p className="error-message" style={{ marginTop: '1rem' }}>{error}</p>}

      <div className="account-content">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="section">
            <h3>الملف الشخصي</h3>
            {loading ? (
              <p>جاري التحميل...</p>
            ) : editMode ? (
              <form onSubmit={handleUpdateProfile} className="auth-form" style={{ marginTop: '1rem' }}>
                <div className="auth-field">
                  <label htmlFor="profile-name">الاسم الكامل</label>
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
                  <label htmlFor="profile-phone">رقم الهاتف</label>
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
                  <label htmlFor="profile-email">البريد الإلكتروني</label>
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
                    {loading ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                  <button type="button" className="button-secondary" onClick={() => setEditMode(false)}>
                    إلغاء
                  </button>
                </div>
              </form>
            ) : profile ? (
              <div style={{ marginTop: '1rem' }} className="stack-md">
                <p><strong>الاسم:</strong> {profile.fullName}</p>
                <p><strong>الهاتف:</strong> {profile.phone}</p>
                <p><strong>البريد:</strong> {profile.email ?? 'غير محدد'}</p>
                <p><strong>تاريخ الانضمام:</strong> {new Date(profile.createdAt).toLocaleDateString('ar')}</p>
                <button className="button-secondary" onClick={() => setEditMode(true)}>
                  تعديل
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>العناوين</h3>
              <button className="button-primary" onClick={() => setShowAddAddress(!showAddAddress)}>
                {showAddAddress ? 'إلغاء' : 'إضافة عنوان'}
              </button>
            </div>

            {showAddAddress && (
              <form onSubmit={handleAddAddress} className="auth-form" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
                <div className="auth-field">
                  <label htmlFor="addr-line">العنوان</label>
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
                  <label htmlFor="addr-city">المدينة</label>
                  <input
                    id="addr-city"
                    type="text"
                    className="input"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="addr-area">المنطقة</label>
                  <input
                    id="addr-area"
                    type="text"
                    className="input"
                    value={addressForm.area}
                    onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="addr-notes">ملاحظات</label>
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
                  جعله العنوان الافتراضي
                </label>
                <button type="submit" className="button-primary" disabled={loading}>
                  {loading ? 'جاري الإضافة...' : 'إضافة العنوان'}
                </button>
              </form>
            )}

            <div className="stack-md" style={{ marginTop: '1rem' }}>
              {loading ? (
                <p>جاري التحميل...</p>
              ) : addresses.length === 0 ? (
                <p className="muted">لا توجد عناوين محفوظة</p>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="address-card">
                    <div>
                      <p><strong>{addr.addressLine}</strong></p>
                      {addr.city && <p>{addr.city}{addr.area && ` - ${addr.area}`}</p>}
                      {addr.notes && <p className="muted">{addr.notes}</p>}
                      {addr.isDefault && <span className="badge">افتراضي</span>}
                    </div>
                    <button
                      className="button-secondary"
                      onClick={() => handleDeleteAddress(addr.id)}
                      style={{ color: 'var(--danger)' }}
                    >
                      حذف
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
            <h3>المفضلة</h3>
            <div className="stack-md" style={{ marginTop: '1rem' }}>
              {loading ? (
                <p>جاري التحميل...</p>
              ) : wishlist.length === 0 ? (
                <p className="muted">لا توجد منتجات في المفضلة</p>
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
                          <p className="muted">{item.priceFrom.toLocaleString('ar')} ر.ي</p>
                        )}
                      </div>
                    </div>
                    <button
                      className="button-secondary"
                      onClick={() => handleRemoveFromWishlist(item.productId)}
                      style={{ color: 'var(--danger)' }}
                    >
                      إزالة
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
            <h3>تقييماتي</h3>
            <div className="stack-md" style={{ marginTop: '1rem' }}>
              {loading ? (
                <p>جاري التحميل...</p>
              ) : reviews.length === 0 ? (
                <p className="muted">لم تقم بإضافة أي تقييمات بعد</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <div className="review-rating">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                      {review.isVerifiedPurchase && (
                        <span className="badge">شراء موثق</span>
                      )}
                    </div>
                    {review.comment && <p style={{ margin: '0.5rem 0' }}>{review.comment}</p>}
                    <p className="muted" style={{ fontSize: '0.8rem' }}>
                      {new Date(review.createdAt).toLocaleDateString('ar')}
                    </p>
                    <button
                      className="button-secondary"
                      onClick={() => handleDeleteReview(review.id)}
                      style={{ color: 'var(--danger)', marginTop: '0.5rem' }}
                    >
                      حذف التقييم
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
            <h3>طلباتي ({ordersTotal})</h3>
            <div className="stack-md" style={{ marginTop: '1rem' }}>
              {loading ? (
                <p>جاري التحميل...</p>
              ) : orders.length === 0 ? (
                <p className="muted">لا توجد طلبات سابقة</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div>
                        <strong>طلب #{order.orderCode}</strong>
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
                        <span>المجموع الفرعي</span>
                        <span>{order.subtotal.toFixed(2)} {order.currencyCode}</span>
                      </div>
                      <div className="order-row">
                        <span>الشحن</span>
                        <span>{order.shippingFee.toFixed(2)} {order.currencyCode}</span>
                      </div>
                      {order.discountTotal > 0 && (
                        <div className="order-row">
                          <span>الخصم</span>
                          <span className="discount">-{order.discountTotal.toFixed(2)} {order.currencyCode}</span>
                        </div>
                      )}
                      <div className="order-row total">
                        <span>الإجمالي</span>
                        <strong>{order.total.toFixed(2)} {order.currencyCode}</strong>
                      </div>
                    </div>
                    <Link
                      href={`/track-order?orderCode=${encodeURIComponent(order.orderCode)}`}
                      className="button-secondary"
                    >
                      تتبع الطلب
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button
          className="button-secondary"
          onClick={async () => { await logout(); }}
          style={{ color: 'var(--danger)' }}
        >
          تسجيل الخروج
        </button>
      </div>
    </main>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    processing: 'قيد المعالجة',
    shipped: 'تم الشحن',
    delivered: 'تم التوصيل',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    refunded: 'مسترجع',
  };
  return labels[status] ?? status;
}
