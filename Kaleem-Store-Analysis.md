# Kaleem Store — تحليل شامل (Store Platform)

> **الهدف:** تحويل “كليم ستور” إلى منصة متاجر مستقلة (Yemen-first) على نمط سلة/زد، مع **قوالب/ثيمات** احترافية و**دومينات مخصصة**، وبنية قابلة للتوسع إلى Marketplace للتكاملات (ومنها Kaleem AI كتطبيق).

---

## 1) ملخص تنفيذي

**Kaleem Store** منصة تجارة إلكترونية تمنح التاجر:
- إنشاء متجر وتشغيل واجهة Storefront جاهزة.
- إدارة المنتجات/الفئات/السمات/الأسعار/المخزون.
- إدارة الطلبات والشحن والدفع (مع مراعاة واقع اليمن).
- تشغيل عروض وكوبونات وتسويق أساسي.
- **تخصيص كامل للمظهر** عبر Theme Engine (Sections + Presets) مع **Draft/Publish/Preview**.
- **ربط دومين مخصص** (Custom Domain) مع تحقق وSSL تلقائي.

> تم اعتماد **فصل تام** عن Kaleem AI (مستخدمون/دخول/بيانات مستقلة). الربط بينهما لاحقًا يكون كتطبيق/تكامل عبر OAuth أو API Key + Webhooks.

---

## 2) الحدود (Scope) وما ليس ضمنه

### ضمن نطاق كليم ستور
- التجارة: Catalog, Orders, Promotions, Checkout, Shipping, Payments (COD/تحويل…).
- Storefront + Admin Dashboard للتاجر.
- Themes + Custom Domains.
- تكاملات أساسية (Webhooks / API) كبوابة مستقبلية للـMarketplace.

### خارج النطاق (حالياً)
- أي منطق AI (قنوات/معرفة/فيكتور…) -> هذا في Kaleem AI.
- بوابات دفع محلية متقدمة أو ربط شركات شحن كبيرة (تأتي في مراحل لاحقة عبر Integrations).

---

## 3) الـPersonas والأدوار

1. **Store Owner (مالك المتجر)**: كل الصلاحيات + إدارة الدومين والثيم والخطط.
2. **Staff (موظف)**: إدارة الطلبات/المنتجات حسب صلاحيات RBAC.
3. **Customer (عميل المتجر)**: تصفح/سلة/شراء/تتبع طلب.
4. **Platform Admin (إدارة المنصة)**: مراجعة متاجر، دعم، مراقبة، سياسات، قياس استهلاك.

---

## 4) معمارية عالية المستوى

### 4.1 خدمات (Backend)
- **Store API (NestJS)**: خدمة واحدة (حالياً) تشمل كل نطاق التجارة.
- **Workers** (اختياري): مهام خلفية (إشعارات، مزامنة، توليد صور مصغرة، نسخ احتياطي…).

> يمكن لاحقاً تقسيم Store API داخلياً (Modular Monolith) إلى: Catalog / Orders / Marketing / Themes / Domains / Integrations.

### 4.2 تطبيقات (Frontend)
- **Merchant Admin Dashboard**: لوحة إدارة المتجر.
- **Storefront**: واجهة العميل.
- **Theme Builder UI**: جزء داخل لوحة التاجر (أو تطبيق مستقل لاحقاً) لتخصيص القوالب.

### 4.3 Multi-Tenancy
- كل البيانات مرتبطة بـ **storeId/merchantId**.
- Storefront يحدد المتجر عبر:
  - Subdomain: `store-slug.kaleem.app`
  - أو Custom Domain: `mystore.com` (من خلال `Host` header).

---

## 5) اختيار قاعدة البيانات (القرار)

### 5.1 Postgres + Redis (الموصى به لكليم ستور)
- **PostgreSQL** للبيانات الأساسية (Orders/Payments/Inventory/Relations/Reports).
- **JSONB** داخل Postgres للبيانات المرنة (Theme config, page sections, layout blocks).
- **Redis** للكاش (host→storeId، إعدادات المتجر، جلسات، rate-limit، carts مؤقتة).

**لماذا؟**
- التجارة تحتاج معاملات ACID + علاقات + تقارير (SQL) + منع أخطاء البيانات.
- JSONB يغطي “مرونة” Mongo في الثيمات بدون قاعدة منفصلة.

---

## 6) الوحدات الأساسية (Domains / Modules)

### A) Identity & Access (Auth/RBAC)
- تسجيل/دخول/تحديث توكن.
- RBAC: Owner / Staff + Permissions granular.
- Audit log للأحداث الحساسة (تغيير سعر، حذف منتج، نشر ثيم…).

**مخرجات مهمة:**
- JWT/Refresh Tokens
- Password policies + MFA (مرحلة لاحقة)
- Session management

---

### B) Merchants & Store Settings
- بيانات المتجر: الاسم، الشعار، الهاتف، العنوان، سياسات.
- العملة/التسعير:
  - دعم أسعار متعددة أو “تثبيت سعر عند الطلب”.
  - FX (اختياري) مع حفظ rate على order.

---

### C) Catalog (Products / Categories / Attributes)
**Products**
- عنوان، وصف، صور/فيديو، slug، SEO.
- حالة: Draft / Active / Archived.

**Variants**
- SKU/Barcode، سعر، مخزون، خصائص (لون/حجم).
- صور خاصة بالـvariant (اختياري).

**Categories**
- شجرة تصنيفات + ترتيب.

**Attributes/Tags/Brands**
- للفلترة والبحث.

**بحث/فلترة**
- فلاتر (سمات/سعر/توافق…)
- (لاحقاً) Full-text search أو elastic/Meili كتكامل.

---

### D) Promotions (Coupons / Offers)
- كوبونات:
  - نسبة/مبلغ
  - حد أدنى
  - تواريخ
  - استخدام مرة/متعدد
  - تقييد حسب فئة/منتج/عميل (لاحقاً)
- عروض:
  - خصم منتج/فئة
  - خصم سلة
  - (لاحقاً) Buy X Get Y + Bundles

---

### E) Cart & Checkout
- Cart: إضافة/تعديل/حذف + حفظ مؤقت.
- Checkout سريع:
  - الاسم/الجوال/العنوان/ملاحظة
- طرق الدفع المناسبة لليمن:
  - COD
  - تحويل/حوالة + رفع إيصال
  - (لاحقاً) بوابات دفع/Wallet

---

### F) Orders & Fulfillment
- حالات الطلب:
  - New → Confirmed → Preparing → OutForDelivery → Completed
  - Cancelled / Returned
- Order items + totals + taxes/fees (حسب الحاجة).
- سجل تغييرات الحالة.
- ملاحظات داخلية.

**مخزون**
- خصم المخزون عند تأكيد/دفع (حسب سياسة المتجر).
- منع المخزون السالب + تنبيه قرب النفاد.

---

### G) Shipping & Delivery
- مناطق شحن: مدينة/حي/zone.
- رسوم حسب المنطقة أو ثابتة.
- Pickup from store.
- طباعة ملصق/فاتورة.
- (لاحقاً) Integrations لشركات شحن + Tracking.

---

### H) Media & Assets
- رفع صور/فيديو للمنتجات والثيم.
- تحويل/ضغط صور (thumbnails) لحماية الأداء.
- Storage: R2/S3-compatible أو local مع CDN لاحقاً.

---

### I) Notifications
- للتاجر: push / email / whatsapp (حسب استراتيجيةكم).
- للعميل: إشعار حالة الطلب.
- Queue + retries للموثوقية.

---

### J) Analytics & Reports
- مبيعات يوم/أسبوع/شهر.
- أفضل المنتجات.
- الطلبات الملغاة.
- مناطق أكثر طلباً.
- (لاحقاً) funnel وتحليل القنوات.

---

### K) Integrations (قابل للتوسع)
- Webhooks للأحداث:
  - product.created/updated/deleted
  - order.created/updated
  - inventory.updated
  - coupon.updated
- API Keys / OAuth (مرحلة Marketplace).
- Logs + retries + DLQ للأحداث.

> هذا هو الأساس الذي يسمح بربط Kaleem AI كتطبيق لاحقاً بدون دمج داخلي.

---

## 7) Themes & Templates (القوالب والثيمات) — التصميم الاحترافي

### 7.1 الهدف
تمكين التاجر من تخصيص واجهة المتجر مثل سلة/زد:
- اختيار قالب
- تخصيص ألوان/خطوط/شعار
- بناء الصفحة الرئيسية عبر Sections
- معاينة Preview
- نشر Publish بدون كسر الموقع

### 7.2 Theme Engine (Sections + Schema)
**Theme Registry**
- `themeId`: modern / minimal / classic
- `version`
- قائمة sections المتاحة + schema لكل section

**Store Theme Config**
- `draftConfig`
- `publishedConfig`
- `globals` (colors/fonts/radius/spacing)
- `pages` (home/product/category…)

**Sections**
- كل صفحة تتكون من Sections مرتبة:
  - hero_slider
  - categories_grid
  - featured_products
  - offers_banner
  - testimonials (لاحقاً)
  - footer

**Schema Validation**
- كل Section له JSON schema (نوع الحقول + حدودها)
- الباك يتحقق قبل حفظ draft/publish لمنع إعدادات خاطئة.

### 7.3 Draft / Preview / Publish
- **Draft**: تعديلات لا تظهر للعميل.
- **Preview**: رابط preview token + iFrame.
- **Publish**: نسخ draft إلى published مع version bump.

### 7.4 Presets (جاهز للتاجر)
- Preset “إلكترونيات”
- Preset “ملابس”
- Preset “مطعم”
- كل preset يحدد: sections + ترتيب + ألوان + خطوط.

---

## 8) Custom Domains (الدومينات المخصصة) — التصميم الاحترافي

### 8.1 ما الذي نحتاجه؟
- ربط `mystore.com` لمتجر داخل Kaleem Store.
- تحقق ملكية الدومين.
- SSL تلقائي.
- توجيه صحيح داخل Storefront بناءً على `Host`.

### 8.2 نموذج البيانات
**store_domains**
- `storeId`
- `hostname` (mystore.com / www.mystore.com)
- `status`: pending → verified → active
- `verificationToken`
- `sslStatus`: pending / issued / error
- timestamps

### 8.3 DNS Flow (أفضل ممارسة)
**CNAME (المفضل)**
- `www.mystore.com` CNAME → `stores.kaleem.app`

**Verification**
- TXT record:
  - `_kaleem-verify.mystore.com` = `kaleem-verify=<token>`

**Root domain**
- إمّا redirect إلى www (أفضل)
- أو A record إلى IP (إذا لازم)

### 8.4 SSL
- إصدار تلقائي عبر Let’s Encrypt (HTTP-01) باستخدام Proxy مثل Traefik/Caddy.
- `sslStatus` يعكس حالة الإصدار.
- منع تفعيل HSTS قبل استقرار SSL.

### 8.5 Routing
- Storefront يستقبل الطلب → يقرأ `Host` → يبحث في `store_domains` → يحصل `storeId` → يرندر المتجر.

### 8.6 نقاط أمنية واحترافية
- منع نفس hostname على متجرين.
- cooldown بعد unlink.
- rate-limit على verify checks.
- logs لكل خطوة (DNS/SSL).

---

## 9) نموذج بيانات (High-level ERD)

> هذا “تصور” للجداول الأساسية (قابل للتعديل أثناء التنفيذ).

- stores
- store_users (role, permissions)
- products
- product_variants
- product_images
- categories
- attributes / attribute_values
- inventory_movements (اختياري)
- coupons
- offers
- carts (اختياري/Redis)
- orders
- order_items
- payments (COD/transfer_receipt)
- shipments (zones, fees, tracking)
- customers
- customer_addresses
- store_themes (draft/published JSONB)
- store_domains
- webhooks_subscriptions + webhook_deliveries (للتكاملات)
- audit_logs

**فهرسة (Indexes) مهمة**
- (storeId, createdAt) في orders
- (storeId, slug) في products/categories
- (storeId, sku) في variants
- (hostname) unique في store_domains

---

## 10) API Design (ملخص)

### 10.1 Admin APIs (Merchant)
- Auth: login/refresh/logout
- Store settings: get/update
- Products: CRUD + variants + media
- Categories: CRUD
- Coupons/Offers: CRUD
- Orders: list/detail/update-status
- Shipping zones: CRUD
- Themes:
  - GET published/draft
  - PUT draft
  - POST publish
  - GET preview-token
- Domains:
  - POST add-domain
  - POST verify-domain
  - POST activate-domain
  - DELETE domain
- Integrations:
  - webhooks subscriptions
  - deliveries logs

### 10.2 Storefront APIs (Public)
- GET store info (by host)
- GET products list + filters
- GET product detail
- POST cart/checkout (create order)
- GET order tracking
- GET theme published config

> Storefront يجب أن يكون “خفيف” + caching.

---

## 11) الأداء (Yemen-first)
- ضغط الصور + lazy loading.
- caching:
  - host→storeId
  - published theme config
  - store settings
- تقليل عدد requests في الصفحة الرئيسية عبر “batched endpoints”.
- offline-safe UX (تحميل تدريجي + skeletons).

---

## 12) الأمن والحماية
- RBAC + least privilege.
- Rate limiting (Redis).
- Validation (DTO) + Sanitization.
- حماية رفع الملفات:
  - نوع ملف/حجم/امتداد
  - فحص بسيط (اختياري) + تخزين مع path آمن
- Webhooks:
  - توقيع HMAC
  - replay protection (timestamp/nonce)
- Audit logs للأحداث الحساسة.

---

## 13) المراقبة (Observability)
- Sentry للـerrors.
- Metrics (Prometheus/Grafana): latency, errors, queue depth, DB connections.
- Logs structured + requestId.
- Tracing (OpenTelemetry) لاحقاً.

---

## 14) الاختبارات (Testing Strategy)
- Unit tests:
  - pricing, coupons, inventory rules
- Integration tests:
  - create order transaction
  - publish theme validation
  - domain verify flow
- E2E tests:
  - “مسار شراء كامل”
  - “تعديل ثيم + preview + publish”
  - “ربط دومين + تحقق + SSL status”
- Contract tests:
  - Webhooks payloads + signatures

---

## 15) خارطة طريق تنفيذ (Roadmap)

### Phase 0 — Foundation (أسبوعين)
- Postgres + migrations
- Auth/RBAC
- Stores + Settings
- Media upload
- Basic Storefront resolution by host/subdomain

### Phase 1 — MVP Sellable (4–6 أسابيع)
- Catalog (products/variants/inventory)
- Checkout (COD + transfer receipt)
- Orders + statuses + notifications
- Shipping zones
- Themes MVP (اختيار قالب + globals + sections للـhome)
- Custom domains (add/verify/activate + SSL)

### Phase 2 — Growth (6–10 أسابيع)
- Coupons/Offers advanced
- Reviews/FAQ
- Abandoned cart
- Analytics تحسين
- Integrations: webhooks + delivery logs

### Phase 3 — Platform (3–6 أشهر)
- Marketplace (OAuth + apps install)
- Payment/shipping providers
- Multi-warehouse
- Advanced reporting + funnel

---

## 16) ملاحظات تنفيذية مرتبطة بالمشروع الحالي (توجيه سريع)
- في الباك الحالي يوجد modular structure جيد (catalog/products/orders/offers/storefront/webhooks…)، وهذا يساعد على نقل/تنظيف نطاق المتجر.
- في الفرونت الحالي توجد features/pages متعددة (admin/merchant/store…) ويمكن فصلها إلى:
  - Merchant Admin (Store)
  - Storefront (Public)
  - (لاحقاً) AI Admin مستقل

---

## 17) Definition of Done (معايير جاهزية الإطلاق)
- شراء كامل يعمل end-to-end بدون أخطاء (E2E).
- نشر ثيم بدون كسر الواجهة + rollback بسيط (إعادة نشر نسخة سابقة).
- ربط دومين + إصدار SSL تلقائي + مراقبة حالة.
- مراقبة أخطاء + logs + backups.
- سياسة أمن ورفع ملفات.
- وثائق: API + Webhooks + Theme schemas + DNS guide للتاجر.

---

**نهاية الوثيقة**  
إذا رغبت، أضيف ملحقات جاهزة:
- Theme schemas لأول 8 Sections
- نماذج Webhooks payload + HMAC signing spec
- ERD مرسوم + indexes المقترحة
