# Kaleem Store — خطة تنفيذ النواقص (Roadmap تنفيذ تفصيلي بعد ما تم إنجازه)

> هذه الخطة مبنية على حالة المشروع الحالية كما تم فحصها:  
> **Backend (NestJS + Postgres + Redis + RabbitMQ + MinIO)** جاهز بنسبة كبيرة (Catalog/Checkout/Orders/Themes/Domains/Outbox/Workers).  
> النواقص الأساسية حاليًا تتركز في: **Media/Storage الصحيح، Storefront فعلي، SSL للدومينات المخصصة، Admin UI إنتاجية** + تحسينات SaaS/Inventory/Attributes…  
> **ملاحظة:** لا يوجد “تقدير زمني” هنا — الخطة تركز على ترتيب التنفيذ، المهام، ومعايير الجاهزية (DoD).

---

## 0) أهداف هذه الخطة

1. تحويل المشروع من “API + سكافولد” إلى **منتج متجر SaaS قابل للاستخدام**.
2. إغلاق الـ **Blockers** التي تمنع الإطلاق (Media, Storefront, Domains SSL, Admin).
3. ترقية الجودة إلى مستوى SaaS (Idempotency, Metering, Observability, Backups).

---

## 1) ترتيب الأولويات (Priority Order)

### P0 — لازم قبل أي إطلاق

- Media/Storage serving + MinIO/R2
- Storefront MVP كامل (تصفح + منتج + سلة + Checkout + تتبع)
- Custom Domains: SSL automation + reverse proxy routing
- Admin UI إنتاجية (ليس console)

### P1 — مطلوب لإطلاق قوي (MVP+)

- Attributes/Filters Management + UI
- Inventory احترافي (Movements/Reservations/Low-stock)
- Staff lifecycle (Invite/Disable/Reset)
- Policies pages + SEO basics
- Idempotency checkout + anti-duplication

### P2 — SaaS growth & platform readiness

- SaaS metering توسعة + limits enforcement قوي
- Webhooks/Integrations UI + delivery logs
- Advanced analytics + exports
- Payment gateways/Providers
- Marketplace foundation

---

## 2) Phase 1 — Media & Storage (إغلاق مشكلة الصور والملفات) **[P0]**

### 2.1 القرار الفني (مقترح موحد)

- اعتماد **MinIO محليًا** للتطوير و **R2/S3** للإنتاج.
- استخدام **Presigned URLs** للرفع/التحميل.
- حفظ بيانات الملف في DB (media_assets) + ربطه بمنتجات/Variants/Theme assets.

### 2.2 المهام (Backend)

- [x] إنشاء `StorageAdapter` موحد:
  - `getPresignedPutUrl(key, contentType, size)`
  - `getPublicUrl(key)` أو `getPresignedGetUrl(key)`
- [x] تحديث `MediaService`:
  - بدل الكتابة في `storage/` محليًا، يستخدم adapter.
  - يسجل metadata (size, contentType, etag, bucket, key, publicUrl?).
- [x] إنشاء Endpoints:
  - `POST /media/presign-upload` (admin)
  - `POST /media/confirm` (بعد الرفع لتسجيل/ربط)
  - `GET /media/:id` (admin)
- [x] ربط الصور بالمنتج:
  - تحديث `products` endpoints لربط `product_images` أو `media_assets`.
- [ ] سياسات أمن للملفات: (جزئي: MIME allowlist + max size ثابت، بدون limits حسب الخطة)
  - allowlist MIME types (jpg/png/webp/mp4…)
  - max size per plan
  - virus scan (اختياري لاحقًا)

### 2.3 المهام (Infra)

- [x] ضبط MinIO في docker-compose:
  - bucket public/private
  - policy للـpublic assets إن رغبت
- [x] إعداد متغيرات البيئة:
  - `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION`
- [ ] (اختياري) proxy/CDN للصور لاحقًا

### 2.4 DoD (معايير نجاح)

- [x] رفع صورة منتج عبر presigned URL ثم ربطها بالمنتج ويظهر رابطها في Storefront.
- [ ] اختبار E2E: إنشاء منتج + رفع صورة + عرض في public product page.

---

## 3) Phase 2 — Storefront MVP (واجهة متجر فعلية) **[P0]**

> الهدف: متجر يعمل فعليًا (Home + Categories + Product + Cart + Checkout + Track order).  
> Storefront الحالي سكافولد فقط — هذا أكبر جزء ناقص.

### 3.1 Multi-tenant resolution (مهم)

- [x] إنشاء Public endpoint: `GET /public/store/resolve`
  - يعتمد على `Host` header
  - يرجع: `storeId`, `storeSlug`, `storeSettings`, `publishedThemeSummary`
- [x] تحديث بقية public endpoints لتقرأ store من `Host` بدل `x-store-id`:
  - إما middleware داخل API يحقن storeId في request
  - أو تمرير storeId داخليًا بعد resolve + caching Redis

### 3.2 الصفحات المطلوبة (Next.js)

#### A) Core

- [x] Home:
  - fetch published theme config
  - render sections (بالحد الأدنى في البداية)
- [x] Category listing:
  - filters basic + pagination
- [x] Product details:
  - gallery + variants + add to cart
- [x] Cart:
  - list items + update qty + remove
- [x] Checkout:
  - form customer + address + shipping zone + payment method (COD/transfer)
- [x] Track order:
  - by phone/orderNumber (حسب الـAPI)

#### B) UX Yemen-first

- [x] skeleton loading + caching
- [x] image optimization + lazy loading
- [ ] failure tolerant (retry)

### 3.3 Theme rendering داخل Storefront

**المرحلة الأولى (MVP rendering):**

- [x] دعم sections الأساسية فقط:
  - Header, Hero, CategoriesGrid, FeaturedProducts, OffersBanner, Footer
- [x] Section Registry في الواجهة:
  - `type -> component`
  - validate minimal to avoid crash
- [x] fallback UI إذا section غير معروف

**المرحلة الثانية (تحسين):**

- [ ] دعم blocks داخل section
- [ ] schema-driven editor لاحقًا في Admin

### 3.4 DoD

- [x] متجر يعمل على subdomain: تصفح → سلة → Checkout → إنشاء Order → تتبع.
- [x] لا توجد اعتمادية على `x-store-id` في public.
- [x] صفحات Home/Product/Checkout تعمل مع published theme.

---

## 4) Phase 3 — Admin Dashboard إنتاجي (بدل Console) **[P0]**

> Admin الحالي أقرب لـ “API Console”. المطلوب لوحة كاملة للتاجر.

### 4.1 Auth UI

- [x] صفحة login + refresh flow
- [ ] تخزين session آمن (httpOnly cookies مفضل إن أمكن)
- [x] حماية routes

### 4.2 Merchant core screens (MVP)

- [ ] Store settings (name, logo, policies) (جزئي: name/logo موجود، policies غير مكتملة)
- [x] Products CRUD + variants + media upload (presigned)
- [x] Categories CRUD
- [x] Orders list + details + status updates
- [x] Shipping zones CRUD
- [x] Promotions:
  - Coupons + Offers
- [x] Themes:
  - load draft/published
  - basic editor (form-based) للـsections الأساسية
  - preview + publish
- [x] Domains:
  - add domain wizard
  - show DNS instructions
  - verify + activate + ssl status

### 4.3 RBAC UX

- [x] شاشة staff/users:
  - [x] list staff
  - [x] assign role/permissions
  - disable user (P1)
  - invite staff (P1)

### 4.4 DoD

- [ ] تاجر يقدر يدير متجره بالكامل بدون استخدام pgAdmin أو Postman.
- [x] media upload يعمل من داخل اللوحة.
- [x] themes/domains flows تعمل end-to-end.

---

## 5) Phase 4 — Custom Domains + SSL Automation (تشغيل فعلي) **[P0]**

> يوجد منطق domains في DB والـAPI (verify/activate)، لكن ينقص الجزء الأهم: **Reverse proxy + إصدار SSL**.

### 5.1 خياران تنفيذ (اختر واحد وامشِ عليه)

#### Option A (موصى به للبساطة): Cloudflare

- [x] الدومين عند العميل على Cloudflare
- [x] CNAME إلى `stores.<your-domain>` (أو A record)
- [x] Cloudflare يتكفل بـ SSL إلى edge
- [x] Origin server يستخدم شهادة Origin أو Full Strict

#### Option B (Self-hosted): Traefik/Caddy + Let’s Encrypt

- proxy أمام storefront يدعم:
  - on-demand certificates
  - routing by host
- يحتاج ضبط جيد للـrate limit وprevent abuse

### 5.2 مهام Option B (Traefik/Caddy)

> تم اختيار Option A، لذلك مهام Option B غير مطلوبة في هذا التنفيذ.

- [ ] إعداد proxy service في docker-compose (prod)
- [ ] تفعيل ACME + storage للـcerts
- [ ] ربط routing:
  - كل host يوجه إلى storefront
- [ ] آلية “allow list” للدومينات:
  - proxy يستعلم (أو يقرأ cache) من API: هل hostname active؟
  - يمنع إصدار cert لغير الدومينات المسجلة (حماية)
- [ ] تحديث API:
  - endpoint داخلي: `GET /internal/domains/active?hostname=...` (secured)
  - تحديث `sslStatus` بناءً على نجاح الإصدار (اختياري)

### 5.3 DoD

- [x] ربط دومين: pending → verified → active
- [x] HTTPS يعمل على الدومين مع شهادة صحيحة
- [x] Storefront يحدد المتجر عبر `Host` بدون مشاكل

---

## 6) Phase 5 — Attributes/Filters (سمات وفلاتر حقيقية) **[P1]**

> الجداول موجودة جزئيًا — المطلوب modules كاملة + UI + دعم بالـpublic filters.

### 6.1 Backend

- [x] Attributes module:
  - CRUD attributes
  - CRUD values
  - ربط attribute بفئة category (اختياري)
- [x] Product ↔ attributes:
  - set values per product/variant
- [x] Public filters:
  - `GET /public/products?attrs[color]=red&attrs[size]=L`
  - indexes على (storeId, attributeId, valueId)

### 6.2 Admin UI

- [x] شاشة إدارة السمات والقيم
- [x] واجهة اختيار قيم المنتج

### 6.3 DoD

- فلترة منتجات تعمل بكفاءة وبنتائج صحيحة من Storefront.
- تاجر يقدر يبني فلترة حقيقية بدون كود.

---

## 7) Phase 6 — Inventory احترافي (Movements + Reservation) **[P1]**

> حاليًا خصم المخزون يحصل عند confirmed. ينقص: الحجز، الحركات، التنبيهات.

### 7.1 تصميم مبسط (موصى به)

- `inventory_movements`:
  - type: adjustment / sale / return / restock
  - qty delta
  - reference (orderId)
- `inventory_reservations` (اختياري):
  - reserved qty لكل variant
  - expiresAt

### 7.2 قواعد

- [x] أثناء checkout:
  - create reservation لمدة قصيرة (مثلاً 10–15 دقيقة) أو حتى الدفع
- [x] عند confirm:
  - convert reservation to sale movement
- [x] عند cancel/expire:
  - release reservation

### 7.3 Alerts

- [x] low stock threshold per variant
- [x] notification للتاجر

### 7.4 DoD

- لا يحصل oversell بسهولة.
- audit واضح لكل تغيير مخزون.

---

## 8) Phase 7 — Staff lifecycle (Invites/Disable/Reset) **[P1]**

### 8.1 Backend

- [x] invite staff endpoint (email/SMS/OTP أو link token)
- [x] accept invite + set password
- [x] disable staff + revoke sessions
- [x] reset password flow

### 8.2 Admin UI

- [x] شاشة إدارة الموظفين كاملة

### 8.3 DoD

- إدارة فريق المتجر بدون تدخل يدوي.

---

## 9) Phase 8 — Payments تحسين (Transfer proof + review) **[P1]**

### 9.1 Backend

- [x] upload transfer receipt (media link)
- [x] payment status machine:
  - pending → under_review → approved → refunded
  - under_review → rejected
- [x] order state transitions مربوطة بالدفع (عرض payment info مع تفاصيل الطلب)

### 9.2 Admin UI

- [x] شاشة مراجعة إيصالات التحويل (PaymentsPanel)
- [x] عرض معلومات الدفع في تفاصيل الطلب

### 9.3 DoD

- دعم تحويل حقيقي مناسب للسوق مع مراجعة منظمة.

---

## 10) Phase 9 — SaaS Controls (Metering + Limits enforcement) **[P2]** ✅

### 10.1 Metering توسيع

- [x] إضافة counters:
  - domains.total
  - storage.used
  - api_calls.monthly
  - webhooks.monthly
- [x] تحديث usage_events على كل حدث مؤثر

### 10.2 Enforcements

- [x] middleware/guard يرفض تجاوز limits (LimitsGuard)
- [x] رسائل واضحة في UI (METRIC_DISPLAY_NAMES + error messages)

### 10.3 Billing readiness

- [x] حالات subscription (cancel, suspend, resume endpoints)
- [x] downgrade behavior (canDowngradePlan with conflict detection)
- [x] suspension behavior (suspendSubscription, resumeSubscription)

### 10.4 DoD

- [x] الخطط تتحكم فعليًا في الميزات بدون "تلاعب".

---

## 11) Phase 10 — Idempotency + Reliability (Checkout) **[P1]** ✅

### 11.1 Idempotency-Key

- [x] دعم header `Idempotency-Key` في checkout
- [x] جدول `idempotency_keys`:
  - storeId, key, requestHash, response, expiresAt

### 11.2 Retry safe

- [x] إذا العميل أعاد نفس الطلب، يرجع نفس orderId بدل إنشاء جديد

### 11.3 DoD

- [x] منع تكرار الطلبات بسبب ضعف الشبكة.

---

## 12) Phase 11 — Observability + Backups + Security Hardening **[P1/P2]** ✅

### 12.1 Observability

- [x] Sentry للـAPI والواجهات
- [x] Prometheus metrics exporter
- [x] Enhanced health checks (liveness, readiness, detailed)

### 12.2 Backups

- [x] cron backup يومي + retention (scripts/backup.sh)
- [x] restore scripts + validation (scripts/restore.sh)

### 12.3 Security

- [x] CORS مضبوط مع custom domains (CorsService)
- [x] password policy + lockouts (PasswordPolicyService, BruteForceGuard)
- [x] webhook signing (WebhookSigningService)

---

## 13) اختبار الجودة (QA Plan) — لكل مرحلة

### 13.1 Unit Tests

- pricing & promotions
- inventory rules
- order transitions

### 13.2 Integration Tests

- checkout transaction
- reservation/stock deduction
- theme publish validation
- domain verification flow

### 13.3 E2E

- مسار شراء كامل
- مسار ثيم: draft→preview→publish
- مسار دومين: add→verify→activate + https (في بيئة staging)

---

## 14) مخرجات نهائية مطلوبة قبل “إطلاق SaaS”

- [x] Storefront MVP مكتمل ويعتمد على Host resolution
- [ ] Admin لوحة كاملة لإدارة كل شيء
- [x] Media working (MinIO/R2) + صور تعمل في الواجهة
- [x] Custom domains + SSL automation
- [x] Monitoring + backups + basic security
- [x] وثائق: API + DNS guide + Theme schemas + Runbooks

---

## 15) قائمة ملفات/وثائق ننشئها (للتنفيذ السريع)

- [x] `docs/storefront-implementation.md` (تفصيل صفحات + data fetching + theme renderer)
- [x] `docs/storage-media.md` (MinIO/R2 + presigned URLs + policies)
- [x] `docs/custom-domains-ssl.md` (Cloudflare vs Traefik/Caddy + خطوات)
- [x] `docs/runbooks/observability.md` (Sentry, Prometheus, Health checks)
- [x] `docs/runbooks/backup-restore.md` (Backup/Restore procedures)
- [x] `docs/runbooks/security.md` (Security hardening guide)
- [ ] `docs/admin-ui-spec.md` (شاشات اللوحة + flows)
- [ ] `docs/testing-matrix.md` (اختبارات لكل endpoint/flow)

---

**نهاية الخطة**
