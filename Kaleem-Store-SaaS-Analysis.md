# Kaleem Store (SaaS) — تحليل شامل كمنصة متاجر

> **هذه الوثيقة تصف كليم ستور كمنتج SaaS مستقل** (مثل سلة/زد): منصة تمكّن التجار من إنشاء متاجرهم وإدارتها وتشغيل واجهات بيع جاهزة، مع قوالب/ثيمات ودومينات مخصصة وخطط اشتراك وقياس استخدام.

---

## 1) تعريف المنتج (Product Definition)

**Kaleem Store** منصة **SaaS متعددة المتاجر (Multi‑Tenant)** تقدم:
- إنشاء متجر خلال دقائق (Onboarding).
- إدارة الكتالوج (Products/Variants/Inventory/Categories).
- تشغيل واجهة متجر (Storefront) جاهزة وسريعة.
- إدارة الطلبات والشحن والدفع بمرونة تناسب السوق المحلي.
- تسويق: كوبونات/عروض/روابط مشاركة/سلات متروكة (مرحليًا).
- **قوالب وثيمات** احترافية عبر Theme Engine (Sections + Presets).
- **دومين مخصص** + SSL تلقائي + توجيه Host.
- لوحة تحكم للتاجر + لوحة إدارة المنصة (Super Admin).

---

## 2) من هو العميل؟ (Personas)

1) **Merchant Owner**: مالك المتجر — إعدادات، خطط، دومين، ثيم، صلاحيات.
2) **Staff**: موظف — طلبات/منتجات حسب RBAC.
3) **Customer**: عميل نهائي — تصفح/شراء/تتبع.
4) **Platform Admin**: إدارة SaaS — دعم/مراجعة/مراقبة/خطط/مخالفات.

---

## 3) نموذج SaaS (Business Model)

### 3.1 Plans (خطط الاشتراك)
أمثلة (قابلة للتعديل):
- **Free**: متجر واحد، منتجات محدودة، ثيم أساسي، Subdomain فقط.
- **Pro**: منتجات/طلبات أعلى، قوالب أكثر، كوبونات، **دومين مخصص**.
- **Business**: عدة موظفين، تقارير متقدمة، Integrations/Webhooks، API Access.
- **Enterprise** (اختياري): SLA، دعم خاص، ميزات مخصصة.

### 3.2 Metering (قياس الاستخدام)
قياسات شائعة:
- عدد المنتجات/Variants
- عدد الطلبات/الشهر
- عدد الموظفين
- عدد الصفحات/الثيمات المنشورة
- الزيارات/الشهر (اختياري)
- استخدام Webhooks/API (لـBusiness+)

> القياس يجب أن يكون “سهل التحقق” ومُسجّل في جداول usage/events.

### 3.3 Billing & Subscription
- Trials (7–14 يوم) للـPro/Business.
- Upgrade/Downgrade (proration اختياري).
- حالات: active / past_due / canceled / suspended.
- طريقة دفع: (حسب البلد) أو فواتير/تحويل (مرحلة).

---

## 4) Multi‑Tenant Design (تصميم تعدد المستأجرين)

### 4.1 Tenant = Store
- **storeId** هو المفتاح لكل البيانات.
- كل Query داخل النظام يجب أن يكون مقيّدًا بـ `storeId` (أو schema-per-tenant إن رغبت لاحقًا).

### 4.2 Tenant Isolation (عزل البيانات)
مستويات العزل:
- **Row-level isolation** (الأكثر شيوعًا): كل جدول يحتوي `storeId` + indexes.
- Schema-per-tenant (مكلف تشغيليًا، يُستخدم فقط إذا احتجت عزلًا قاسيًا).
- Database-per-tenant (Enterprise فقط عادة).

**التوصية:** Row-level مع indexes قوية + مراجعات أمنية.

### 4.3 Host-based Routing
تحديد المتجر يتم عبر `Host`:
- Subdomain: `store-slug.kaleem.app`
- Custom Domain: `mystore.com`
ثم resolve → `storeId` (مع caching).

---

## 5) المكونات الرئيسية (Core Capabilities)

### 5.1 Storefront (واجهة العميل)
- صفحات: Home / Category / Product / Cart / Checkout / Track order
- أداء عالي + تحميل صور محسّن + caching.
- SEO أساسي: slugs، meta، sitemap (مرحليًا).

### 5.2 Merchant Admin Dashboard
- إدارة: المنتجات، الطلبات، العروض، الشحن، الثيم، الدومين، الموظفين.
- Preview للثيم + Publish.
- إدارة الخطة والفواتير.

### 5.3 Platform Admin Console
- إدارة المتاجر والاشتراكات.
- مراقبة الاستخدام.
- إدارة القوالب/الثيمات المتاحة.
- مراجعة الدومينات (حالات pending/verified/ssl).
- دعم العملاء + أدوات تحكم (suspension/feature flags).

---

## 6) Domains & Modules (تحليل نطاقات الباك إند)

### A) Identity & RBAC (هوية وصلاحيات)
- Merchant users: Owner/Staff
- Password policy + Refresh tokens
- RBAC granular permissions (products/orders/themes/domains/billing)
- Audit logs للأحداث الحساسة

### B) Stores (إعدادات المتجر)
- اسم، شعار، ألوان افتراضية، سياسات، ساعات عمل (اختياري)
- قنوات تواصل (واتساب/هاتف/…)
- إعدادات العملة والتسعير

### C) Catalog (الكتالوج)
- Categories (شجرة + ترتيب)
- Products + Variants
- Attributes/Tags/Brands
- Inventory (per variant) + تنبيهات نفاد

### D) Marketing (التسويق)
- Coupons (limits, window, min order)
- Offers (product/category/cart)
- Share links + tracking params
- Abandoned cart (مرحليًا)

### E) Orders (الطلبات)
- Checkout (guest أو customer)
- Order states machine
- Order items + totals
- Returns/Refunds (مرحليًا)

### F) Payments (الدفع)
- COD
- Transfer receipt upload + review status
- (لاحقًا) gateways + wallet

### G) Shipping (الشحن)
- Shipping zones + fees
- Pickup option
- Shipments + tracking code (manual)
- (لاحقًا) شركات شحن integrations

### H) Themes (القوالب والثيمات)
- Theme registry (themes + versions)
- Sections + schema validation
- Draft/Preview/Publish + rollback

### I) Custom Domains
- add/verify/activate
- DNS TXT verification
- SSL status tracking
- host routing + cache

### J) Integrations (Marketplace-ready)
- Webhooks subscriptions
- Delivery logs + retries
- API Keys / OAuth (مرحلة Marketplace)
- Event emission (product/order/inventory/coupon)

### K) Analytics
- Sales daily/weekly
- Top products
- Orders by status
- Cancellations
- (لاحقًا) funnel & cohort

### L) Compliance & Moderation (للمنصة)
- Terms acceptance
- Store suspension/ban
- Content moderation hooks (اختياري)
- Data retention

---

## 7) Themes & Templates (احترافي مثل سلة/زد)

### 7.1 Theme Engine (Sections)
- القالب = مجموعة Components + Sections قابلة للترتيب
- كل Section له **Schema** يحدد الإعدادات (type/limits/required)

**أمثلة Sections (MVP):**
- Header
- Hero Banner/Slider
- Categories Grid
- Featured Products
- Offers Banner
- Footer

### 7.2 Draft / Preview / Publish
- `draftConfig` (لا يظهر للزوار)
- `publishedConfig` (الظاهر)
- Preview عبر token + iFrame
- Publish مع **validation + versioning**
- Rollback بإرجاع نسخة منشورة سابقة

### 7.3 Presets
- Preset “ملابس”
- Preset “إلكترونيات”
- Preset “مطعم”
تغيّر: sections + ترتيب + ألوان + خطوط.

---

## 8) Custom Domains (الدومين المخصص)

### 8.1 Flow
1) التاجر يضيف hostname في لوحة التحكم
2) النظام يعطي تعليمات DNS:
   - الأفضل: `www.domain.com` CNAME → `stores.kaleem.app`
   - Verification: TXT `_kaleem-verify.domain.com = <token>`
3) Verify → Activate
4) إصدار SSL تلقائي (Let’s Encrypt عبر Proxy)
5) يتحول status إلى Active

### 8.2 Data Model
- `store_domains.hostname` UNIQUE
- `status`: pending/verified/active
- `sslStatus`: pending/issued/error
- cooldown عند unlink لمنع hijacking

---

## 9) Data Model (High-level)

> كملخص، كل الجداول تحتوي storeId (أو ترتبط بـStore).

- stores
- store_users (role/permissions)
- customers + addresses
- categories
- products + variants + media
- attributes + attribute_values
- coupons + offers
- orders + order_items
- payments
- shipping_zones + shipments
- store_themes (draft/published JSONB)
- store_domains
- webhook_subscriptions + webhook_deliveries
- usage_events + plan_limits
- audit_logs

---

## 10) Tech Stack & Infrastructure (مقترح)

### 10.1 Backend
- NestJS
- PostgreSQL (JSONB للثيم)
- Redis (cache/rate limit/carts)
- Storage: R2/S3/MinIO
- Queue: BullMQ/Redis أو RabbitMQ (حسب بقية منظومتك)

### 10.2 Frontend
- Admin Dashboard (React/Vite أو Next)
- Storefront (Next SSR/ISR مفضل للSEO والأداء)

### 10.3 Edge/Proxy
- Reverse proxy (Nginx/Traefik/Caddy)
- SSL automation للدومينات
- CDN للصور (اختياري)

---

## 11) Security (SaaS-grade)

- RBAC + least privilege
- Rate limits per store + per IP
- Validation لكل inputs
- Secure file uploads
- Webhook signatures (HMAC + timestamp)
- Audit logs لكل أحداث حساسة (billing, domain activate, theme publish, price changes)
- Isolation: التأكد أن `storeId` لا يُخترق عبر أي endpoint

---

## 12) Observability & Reliability

### 12.1 Monitoring
- Metrics: latency, error rate, DB connections, queue depth
- Logging: structured + requestId
- Alerting: disk, CPU, error spikes

### 12.2 Backups
- pg_dump يومي + retention
- اختبار restore دوري

### 12.3 SLAs (لاحقاً)
- uptime target (مثلاً 99.5% للخطط المدفوعة)
- incident response playbook

---

## 13) Onboarding (رحلة التاجر)

### MVP Onboarding Flow
1) إنشاء حساب تاجر
2) إنشاء متجر (name, slug, logo)
3) اختيار قالب + preset
4) إضافة أول 5 منتجات (wizard)
5) إعداد الشحن (zones)
6) تفعيل الدفع (COD/تحويل)
7) نشر المتجر
8) (اختياري) ربط دومين مخصص

> نجاح الـSaaS يعتمد على تقليل وقت “أول طلب” قدر الإمكان.

---

## 14) Feature Flags (إدارة الإصدارات والخطط)
- تمكين ميزات حسب plan:
  - custom domains
  - advanced themes
  - webhooks/api access
  - staff count
  - advanced reports
- flags per store + per plan

---

## 15) Roadmap (مراحل واضحة)

### Phase 1 — MVP Sellable
- Auth/RBAC
- Stores settings
- Catalog + Variants + Inventory
- Checkout + Orders + Payments (COD/transfer)
- Shipping zones
- Themes MVP (sections + publish)
- Subdomain routing
- Analytics basic

### Phase 2 — Growth
- Coupons/Offers advanced
- Abandoned cart
- Reviews/FAQ
- Custom domains + SSL automation
- Better analytics + exports (Excel)

### Phase 3 — Platform
- Marketplace: OAuth/API keys + app install
- Payment/shipping providers
- Multi-warehouse
- Advanced reporting + funnel

---

## 16) KPIs (مقاييس نجاح SaaS)
- Activation rate: % التجار الذين أكملوا الإعداد ونشروا المتجر
- Time to first order
- Orders per active store
- Churn (إلغاء الاشتراك)
- Conversion rate (زيارات → طلب)
- Support tickets per store
- Error rate / uptime

---

## 17) Definition of Done (جاهزية إطلاق SaaS)
- مسار شراء كامل يعمل E2E
- Themes: draft/preview/publish + rollback
- Custom domain: pending→verified→active + SSL issued
- Plans + limits + billing states
- Monitoring + backups + restore tested
- وثائق: API + DNS guide + Theme schemas

---

**نهاية الوثيقة**
