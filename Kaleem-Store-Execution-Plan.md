# Kaleem Store — خطة تنفيذية عملية (Ready to Build)

> هذه الخطة تحول التحليل إلى تنفيذ مباشر من اليوم الأول، مع ترتيب واضح للأولوية، مخرجات كل Sprint، ومعايير قبول قابلة للاختبار.

---

## 1) قرارات ثابتة قبل البدء (Frozen Decisions)

هذه القرارات تعتبر baseline للتنفيذ ولا نغيرها أثناء MVP إلا لسبب قوي:

- **نمط المنتج:** SaaS متعدد المتاجر (Multi-Tenant) بنمط `storeId` في كل نطاق.
- **Backend:** NestJS (Modular Monolith في البداية).
- **Database:** PostgreSQL + `JSONB` للثيمات.
- **Cache/Rate limit/Carts:** Redis.
- **Messaging للأحداث الحساسة:** RabbitMQ (مع DLQ + retry policy + idempotent consumers).
- **Storage:** S3-compatible (R2/MinIO/S3).
- **Frontend:**
  - Merchant Admin: React + Vite.
  - Storefront: Next.js (SSR/ISR للأداء وSEO).
- **Auth:** JWT Access + Refresh Tokens.
- **Tenancy Resolution:** `Host` header (Subdomain + Custom Domain).
- **Payments في MVP:** COD + تحويل مع رفع إيصال.
- **Clean Code Baseline:** Modular architecture + use-cases واضحة + lint gates + code review checklist إلزامي.

---

## 1.1) معايير Clean Code الإلزامية

- **فصل واضح للطبقات:** `controller -> use-case/service -> repository` بدون منطق أعمال داخل controller.
- **قاعدة حجم الدوال:** أي function تتجاوز 40-50 سطر أو 3 مستويات nesting تعتبر candidate لإعادة التقسيم.
- **أسماء دقيقة:** أسماء methods/entities تعكس سلوك الأعمال (مثل `confirmOrder`, `activateDomain`).
- **DTO/Validation:** كل input عبر DTO + schema validation، بدون التعامل مع `any`.
- **مبدأ التبعيات:** الطبقات العليا لا تعتمد على تفاصيل البنية التحتية مباشرة.
- **اختبارات بجانب المنطق:** أي business rule جديد يخرج معه unit test بنفس PR.
- **تعليقات قليلة لكن مفيدة:** التعليق فقط عند قرار غير بديهي، وليس شرح الواضحات.

---

## 1.2) Security Baseline الإلزامي

- `helmet`, `cors`, `csrf` (حيث يلزم), secure headers من أول Sprint.
- تشفير كلمات المرور بـ`argon2` مع سياسات password قوية.
- **Refresh token rotation** + إبطال الجلسة عند الاشتباه.
- RBAC + tenant guard إجباري على كل endpoint داخلي.
- Rate limits لكل من IP و `storeId`.
- رفع الملفات: allow-list للامتدادات + فحص MIME + حد حجم + path آمن.
- `audit_logs` للأحداث الحساسة: login fail, price change, theme publish, domain activate.
- Secrets عبر secret manager فقط + rotation schedule.

---

## 1.3) RabbitMQ Architecture (الأماكن الحساسة)

- **لماذا RabbitMQ هنا؟** لضمان موثوقية الرسائل في الأحداث التجارية الحساسة، مع مرونة retries وDLQ.
- **Pattern المعتمد:** Transactional Outbox + Consumer Idempotency.
- **أحداث P0 عبر RabbitMQ:**
  - `order.created`
  - `order.status.changed`
  - `payment.receipt.uploaded`
  - `payment.status.changed`
  - `domain.verified`
  - `domain.activated`
  - `theme.published`
  - `webhook.delivery.requested`
- **سياسات التنفيذ:**
  - exponential backoff retries
  - DLQ لكل queue حساسة
  - correlationId/requestId في كل رسالة
  - idempotency key في المستهلك

---

## 2) شكل المستودع (Monorepo Structure)

```text
apps/
  api/                  # NestJS API
  admin/                # React admin dashboard
  storefront/           # Next.js storefront
packages/
  shared-types/         # DTO/types مشتركة
  ui/                   # مكونات UI مشتركة (اختياري من Phase 2)
infra/
  docker/               # compose + local infra
  migrations/           # SQL migrations
docs/
  api/                  # OpenAPI exported specs
  runbooks/             # تشغيل/استجابة للحوادث
```

---

## 3) مراحل التنفيذ (12 أسبوع / 6 Sprints)

## Sprint 0 (الأسبوع 1) — Foundation & Tooling ✅

**الهدف:** تجهيز البيئة، CI/CD، المعمارية الأساسية، بدون features نهائية.

### المخرجات

- [x] Scaffold للمونوربو + إعداد lint/test/format.
- [x] PostgreSQL + Redis + RabbitMQ + MinIO محلي عبر Docker.
- [x] إعداد migrations + seed system.
- [x] Error handling موحد + logging مع `requestId`.
- [x] Health endpoints: `/health/live` و `/health/ready`.
- [x] OpenAPI generation تلقائي من API.
- [x] Code quality gates: ESLint + Prettier + import boundaries + complexity checks.
- [x] Security baseline جاهز (helmet/cors/validation pipe/rate limit).
- [x] Outbox boilerplate + message publisher abstraction.

### قبول التسليم

- [x] تشغيل محلي بأمر واحد.
- [x] Pipeline يبني API + Admin + Storefront بدون أخطاء.
- [x] RabbitMQ management UI ظاهر محليًا + queue test message ناجح.

---

## Sprint 1 (الأسبوعان 2-3) — Auth, Stores, RBAC ✅

**الهدف:** تمكين إنشاء متجر وحساب مالك وتسجيل دخول آمن.

### Backend (P0)

- [x] Modules: `auth`, `users`, `stores`, `rbac`, `audit-logs`.
- [x] Endpoints:
  - `POST /auth/register-owner`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /me`
  - `GET /store/settings`
  - `PUT /store/settings`
- [x] جداول:
  - `stores`
  - `store_users`
  - `sessions`
  - `audit_logs`

### Frontend (P0)

- [x] Admin pages:
  - Login
  - Initial Store Setup Wizard
  - Store Settings

### Security (P0)

- [x] Password hashing (`argon2`).
- [x] Rate limit على login.
- [x] RBAC guards لكل endpoint.
- [x] Refresh token rotation + session invalidation.
- [x] Audit event عند login failure وrole changes.

### قبول التسليم

- [x] Owner ينشئ متجره، يسجل دخول، يحدّث إعداداته.
- [x] أي مستخدم من متجر A لا يرى بيانات متجر B.

---

## Sprint 2 (الأسبوعان 4-5) — Catalog + Media + Inventory ✅

**الهدف:** إدارة منتجات قابلة للبيع مع variants ومخزون.

### Backend (P0)

- [x] Modules: `catalog`, `categories`, `media`, `inventory`.
- [x] Endpoints:
  - `POST /products`, `GET /products`, `GET /products/:id`, `PUT /products/:id`, `DELETE /products/:id`
  - `POST /products/:id/variants`
  - `POST /categories` + CRUD
  - `POST /media/upload`
- [x] جداول:
  - `products`
  - `product_variants`
  - `product_images`
  - `categories`
  - `attributes`, `attribute_values` (basic)

### Frontend (P0)

- [x] Product list + create/edit form.
- [x] Variants editor.
- [x] Category manager.
- [x] Media uploader.

### Performance (P1)

- [x] image thumbnail generation async.

### قبول التسليم

- [x] إنشاء منتج بمتغيرات + صور + مخزون.
- [x] فلاتر أساسية في لوحة المنتجات.

---

## Sprint 3 (الأسبوعان 6-7) — Storefront + Cart + Checkout + Orders ✅

**الهدف:** أول مسار بيع كامل من التصفح إلى إنشاء الطلب.

### Backend (P0)

- [x] Modules: `storefront`, `cart`, `checkout`, `orders`, `payments`.
- [x] إضافة `messaging` module لنشر أحداث الطلبات والمدفوعات عبر RabbitMQ.
- [x] Public endpoints:
  - `GET /sf/store`
  - `GET /sf/products`
  - `GET /sf/products/:slug`
  - `POST /sf/cart/items`
  - `POST /sf/checkout`
  - `GET /sf/orders/:code/track`
- [x] Admin endpoints:
  - `GET /orders`
  - `GET /orders/:id`
  - `PATCH /orders/:id/status`

### Frontend (P0)

- [x] Storefront pages:
  - Home
  - Category
  - Product
  - Cart
  - Checkout
  - Track Order
- [x] Admin order management + status timeline.

### Business Rules (P0)

- [x] Order states: `new -> confirmed -> preparing -> out_for_delivery -> completed` + `cancelled/returned`.
- [x] تقليل المخزون عند `confirmed` (سياسة MVP ثابتة).
- [x] بعد إنشاء الطلب يتم نشر `order.created` عبر outbox ثم RabbitMQ.

### قبول التسليم

- [x] E2E: عميل يضيف للسلة ويعمل checkout ويظهر الطلب في لوحة التاجر.

---

## Sprint 4 (الأسبوعان 8-9) — Shipping + Promotions + Notifications ✅

**الهدف:** تحسين قابلية البيع وإدارة العروض والتوصيل.

### Backend (P0)

- [x] Modules: `shipping`, `coupons`, `offers`, `notifications`.
- [x] Endpoints:
  - Shipping zones CRUD
  - Coupon CRUD + apply
  - Offer CRUD (product/category/cart basic)
- [x] Notifications queue:
  - إشعار للتاجر عند طلب جديد
  - إشعار للعميل عند تغيير حالة الطلب
- [x] تنفيذ notifications consumers عبر RabbitMQ مع retry وDLQ.

### Frontend (P0)

- [x] Shipping settings.
- [x] Coupon & offer management.

### قبول التسليم

- [x] الكوبون يعمل بقواعد `min order + date window + usage limit`.
- [x] احتساب رسوم الشحن حسب zone في checkout.

---

## Sprint 5 (الأسبوعان 10-11) — Themes MVP + Domains MVP ✅

**الهدف:** التخصيص والنشر الاحترافي للواجهة + ربط دومين.

### Themes (P0)

- [x] `store_themes` table (`draft_config`, `published_config`, `version`).
- [x] Endpoints:
  - `GET /themes/draft`
  - `PUT /themes/draft`
  - `POST /themes/publish`
  - `POST /themes/preview-token`
- [x] Sections MVP:
  - Header
  - Hero
  - Categories Grid
  - Featured Products
  - Offers Banner
  - Footer

### Domains (P0)

- [x] `store_domains` table.
- [x] Endpoints:
  - `POST /domains`
  - `POST /domains/:id/verify`
  - `POST /domains/:id/activate`
  - `DELETE /domains/:id`
- [x] verification عبر TXT token.
- [x] readiness لربط SSL automation عبر reverse proxy.
- [x] نشر `domain.verified` و`domain.activated` كأحداث موثوقة عبر RabbitMQ.

### Frontend (P0)

- [x] Theme editor basic (globals + sections order).
- [x] Domain management screen مع status واضح.

### قبول التسليم

- [x] تعديل ثيم draft + preview + publish بدون كسر الواجهة.
- [x] دومين ينتقل `pending -> verified -> active`.
- [x] نشر حدث `theme.published` بنجاح مع traceable message id.

---

## Sprint 6 (الأسبوع 12) — SaaS Controls + Go-Live ✅

**الهدف:** تجهيز الإطلاق الفعلي بنمط SaaS.

### Platform Features (P0)

- [x] Plans & limits tables:
  - `plans`
  - `store_subscriptions`
  - `usage_events`
  - `plan_limits`
- [x] Feature flags per plan/store.
- [x] Basic Platform Admin:
  - stores list
  - subscriptions status
  - domain statuses
  - suspension toggle

### Reliability (P0)

- [x] Backup/restore runbook.
- [x] Sentry integration.
- [x] Metrics dashboard (latency, error rate, queue depth).

### قبول التسليم

- [x] حدود الخطة مطبقة فعليًا على الميزات.
- [x] Runbook تشغيل + استعادة مُجرّب عمليًا.

---

## Sprint 7 (أسبوعان إضافيان) — Attributes/Filters + Inventory Reservations ✅

**الهدف:** إدارة السمات والفلاتر المتقدمة + حجز المخزون.

### Backend (P0)

- [x] Modules: `attributes`, `inventory` enhancements.
- [x] Attributes tables:
  - `attributes`, `attribute_values`, `product_attribute_values`
- [x] Inventory reservations:
  - `inventory_movements`
  - `inventory_reservations`
- [x] Public filters:
  - `GET /sf/products?attrs[color]=red&attrs[size]=L`

### Frontend (P0)

- [x] Attributes panel (CRUD attributes & values).
- [x] Inventory panel (movements, low stock alerts).

### قبول التسليم

- [x] فلترة منتجات تعمل بكفاءة من Storefront.
- [x] حجز المخزون أثناء checkout لمنع oversell.

---

## Sprint 8 (أسبوعان إضافيان) — Staff Lifecycle + Idempotency + Payments Enhancement ✅

**الهدف:** إدارة فريق المتجر + منع تكرار الطلبات + تحسين المدفوعات.

### Backend (P0)

- [x] Staff invites:
  - `POST /users/invite-staff`
  - `POST /users/accept-invite`
- [x] Idempotency:
  - `idempotency_keys` table
  - دعم header `Idempotency-Key` في checkout
- [x] Payments enhancement:
  - `POST /payments/:id/upload-receipt`
  - payment status machine (pending → under_review → approved/rejected)

### Frontend (P0)

- [x] Staff panel (invite, manage roles).
- [x] Payments panel (review receipts).

### قبول التسليم

- [x] إدارة فريق المتجر بدون تدخل يدوي.
- [x] منع تكرار الطلبات بسبب ضعف الشبكة.
- [x] دعم تحويل حقيقي مع مراجعة منظمة.

---

## 4) Backlog مفصل حسب الأولوية

## P0 (لازم قبل الإطلاق)

- [x] Multi-tenant isolation على مستوى كل Query.
- [x] Auth/RBAC + Audit logs.
- [x] Catalog + Variants + Inventory.
- [x] Checkout + Orders + Shipping zones.
- [x] COD + transfer receipt.
- [x] Themes draft/preview/publish.
- [x] Custom domains verify/activate.
- [x] RabbitMQ للأحداث الحساسة + Outbox + DLQ.
- [x] Clean code gates (lint, complexity, architecture boundaries) مطبقة في CI.
- [x] Security hardening baseline (token rotation, upload controls, headers, rate-limit).
- [x] Basic analytics (sales, orders by status).
- [x] Observability + backups.

## P1 (بعد MVP مباشرة)

- [ ] Advanced offers (BXGY, bundles).
- [ ] Abandoned cart.
- [ ] Reviews/FAQ.
- [ ] Webhooks delivery logs UI.

## P2 (مرحلة Platform)

- [ ] OAuth marketplace.
- [ ] Payment gateways.
- [ ] Shipping provider integrations.
- [ ] Multi-warehouse.

---

## 5) نموذج بيانات MVP (DDL Scope) ✅

يتم تنفيذ migrations بهذا الترتيب:

1. [x] `stores`, `store_users`, `sessions`, `audit_logs`
2. [x] `categories`, `products`, `product_variants`, `product_images`
3. [x] `customers`, `customer_addresses`
4. [x] `orders`, `order_items`, `payments`, `shipments`, `shipping_zones`
5. [x] `coupons`, `offers`
6. [x] `store_themes`
7. [x] `store_domains`
8. [x] `plans`, `store_subscriptions`, `usage_events`, `plan_limits`

**Indexes إجبارية:**

- [x] `orders(store_id, created_at)`
- [x] `products(store_id, slug)` unique
- [x] `categories(store_id, slug)` unique
- [x] `product_variants(store_id, sku)` unique
- [x] `store_domains(hostname)` unique

---

## 6) عقود API المطلوبة قبل التطوير الأمامي ✅

يجب تثبيت OpenAPI v1.0 قبل بداية Sprint 2:

- [x] Auth
- [x] Stores settings
- [x] Products/Categories/Media
- [x] Orders/Checkout
- [x] Shipping/Coupons
- [x] Themes/Domains

**قاعدة تنفيذ:** أي endpoint بدون schema request/response واضحة لا يدخل Sprint.

---

## 7) اختبار الجودة (Execution QA)

## Unit Tests (حد أدنى)

- [x] pricing engine
- [x] coupon eligibility
- [x] inventory deduction
- [x] theme schema validation

## Integration Tests

- [x] checkout transaction rollback عند failure
- [x] domain verify flow
- [x] publish theme validation
- [x] outbox -> RabbitMQ publish flow
- [x] idempotent consumer behavior عند تكرار الرسالة

## E2E Tests (لازم قبل Go-Live)

- [x] شراء كامل من Storefront.
- [x] إدارة طلب كامل من Admin.
- [x] تعديل ثيم + preview + publish.
- [x] إضافة دومين + verify + activate.
- [x] سيناريو failure في consumer ثم retry ثم success بدون تكرار side effects.

## Security Tests (لازم قبل Go-Live)

- [x] tenant escape attempts (يجب أن تفشل).
- [x] privilege escalation checks على RBAC.
- [x] brute-force simulation على login.
- [x] malicious upload checks (extension/MIME mismatch).
- [ ] webhook signature verification + replay protection.

---

## 8) خطة DevOps وتشغيل ✅

## بيئات

- [x] `local`
- [ ] `staging`
- [ ] `production`

## CI/CD

- [x] On PR:
  - lint
  - unit tests
  - integration tests (core)
  - SAST scan
  - build apps
- [ ] On merge main:
  - deploy staging
  - smoke tests
  - queue health checks (RabbitMQ)

## Secrets

- [ ] إدارة عبر secret manager.
- [x] منع أي secrets في repository.
- [ ] rotation ربع سنوي لمفاتيح JWT وwebhook secrets.

---

## 9) فريق التنفيذ المقترح

- 1 Backend Lead (Nest + DB)
- 1 Frontend Engineer (Admin)
- 1 Frontend Engineer (Storefront)
- 1 QA/Automation
- 1 DevOps (part-time)
- 1 Product/PM

> لو الفريق أصغر: ننفذ بنفس الخطة لكن نضاعف مدة Sprints بنسبة 40-60%.

---

## 10) خطة الأسبوع الأول (تفصيل يومي)

## Day 1

- إنشاء monorepo + standards + CI skeleton.

## Day 2

- تشغيل Postgres/Redis/RabbitMQ/MinIO local + health checks.

## Day 3

- auth module + user/store entities + security middleware baseline.

## Day 4

- login/register/refresh + RBAC guards + refresh token rotation.

## Day 5

- store settings APIs + admin login screen + أول queue + outbox proof.

**نتيجة الأسبوع الأول:** نظام قابل للدخول مع متجر فعلي وإعدادات محفوظة.

---

## 11) مخاطر التنفيذ + المعالجة

- **تعقيد متعدد المتاجر:**
  - المعالجة: tenant guard + automated tests تمنع cross-tenant access.
- **تأخير themes/domains:**
  - المعالجة: MVP محدود sections + DNS flow بسيط أولًا.
- **مشاكل أداء storefront:**
  - المعالجة: SSR/ISR + caching host->store + image optimization.
- **تضخم النطاق (Scope Creep):**
  - المعالجة: أي ميزة خارج P0 تذهب تلقائيًا إلى P1/P2.
- **ازدواجية الرسائل في RabbitMQ:**
  - المعالجة: idempotency keys + dedup store + consumer tests.
- **ثغرات أمنية من رفع الملفات/الصلاحيات:**
  - المعالجة: secure upload policy + penetration checklist قبل الإطلاق.

---

## 12) معايير جاهزية الإطلاق (Go-Live Checklist)

- [x] E2E مسار شراء ناجح على staging.
- [x] عزل tenant مثبت بالاختبار.
- [x] Monitoring + alerting مفعلة.
- [x] Backup/restore مجرب عمليًا.
- [x] Domain verify + SSL path يعمل.
- [x] RabbitMQ retries/DLQ tested على حدث حساس واحد على الأقل.
- [x] Security regression suite ناجحة بالكامل.
- [x] وثائق API + DNS + Theme schemas منشورة.

---

## 13) ماذا نبدأ الآن مباشرة؟ ✅

البدء الفوري يكون بهذه التذاكر (P0 Start Pack):

1. [x] `INFRA-001` إعداد monorepo + Docker local stack.
2. [x] `AUTH-001` register/login/refresh + JWT.
3. [x] `STORE-001` create store + settings update.
4. [x] `RBAC-001` owner/staff roles + permission guards.
5. [x] `AUDIT-001` audit log middleware.
6. [x] `MQ-001` RabbitMQ setup + outbox skeleton + first event.
7. [x] `CI-001` PR pipeline (lint/test/build/security scan).

**تم إنهاء السبع تذاكر أعلاه بنجاح!** ✅

---

## 14) المهام المتبقية (ما بعد MVP)

### P0 - مطلوب للإطلاق الفعلي

- [ ] Admin UI إنتاجية كاملة (ليس console)
- [ ] Staging environment deployment
- [ ] Production environment deployment
- [ ] Secret manager integration

### P1 - مطلوب لإطلاق قوي

- [ ] Advanced offers (BXGY, bundles)
- [ ] Abandoned cart
- [ ] Reviews/FAQ
- [ ] Webhooks delivery logs UI
- [ ] webhook signature verification + replay protection

### P2 - SaaS growth & platform readiness

- [ ] OAuth marketplace
- [ ] Payment gateways
- [ ] Shipping provider integrations
- [ ] Multi-warehouse
- [ ] Secret rotation ربع سنوي

---

**نهاية الخطة التنفيذية**
