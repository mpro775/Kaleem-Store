# Kaleem Store — Jira Backlog (جاهز للتنفيذ)

> نسخة تنفيذية مباشرة من الخطة، بصيغة Epics/Stories مع Story Points وAcceptance Criteria وDependencies.

---

## 1) إعداد مشروع Jira (مرة واحدة)

- **Project Key مقترح:** `KSTORE`
- **Issue Types:** Epic, Story, Task, Bug, Sub-task
- **Workflow:** Backlog -> Selected -> In Progress -> Code Review -> QA -> Done
- **Priorities:** Highest, High, Medium
- **Definition of Done (DoD):**
  - كود مدمج على `main` عبر PR
  - اختبارات مطلوبة نجحت (unit/integration/e2e حسب نوع المهمة)
  - OpenAPI/Docs محدثة عند تغيير API
  - لا توجد ثغرات حرجة من SAST

---

## 2) Epics

| Epic ID | الاسم | الهدف | نطاق السبرنت |
|---|---|---|---|
| EPIC-01 | Platform Foundation | تجهيز البنية الأساسية + CI + جودة الكود | Sprint 0 |
| EPIC-02 | Identity & Multi-Tenant Security | Auth/RBAC/Tenant Isolation/Audit | Sprint 1 |
| EPIC-03 | Catalog & Inventory | منتجات/تصنيفات/متغيرات/مخزون/وسائط | Sprint 2 |
| EPIC-04 | Storefront & Orders | مسار بيع كامل + إدارة الطلبات | Sprint 3 |
| EPIC-05 | Shipping, Promotions, Notifications | الشحن والعروض والإشعارات | Sprint 4 |
| EPIC-06 | Themes & Custom Domains | تخصيص الثيم + دومين مخصص + نشر | Sprint 5 |
| EPIC-07 | SaaS Controls & Go-Live | الخطط/الحدود/المراقبة/الإطلاق | Sprint 6 |
| EPIC-08 | RabbitMQ Reliability | Outbox + DLQ + Idempotency للأحداث الحساسة | Sprints 0-6 |

---

## 3) Sprint 0 (Foundation)

### INFRA-001 — Monorepo Scaffold
- **Type:** Story
- **Epic:** EPIC-01
- **SP:** 3
- **Priority:** Highest
- **Dependencies:** None
- **Acceptance Criteria:**
  - وجود `apps/api`, `apps/admin`, `apps/storefront`, `packages/shared-types`, `infra/`.
  - أوامر `install`, `build`, `test`, `lint` تعمل من root.

### INFRA-002 — Local Infra Stack
- **Type:** Story
- **Epic:** EPIC-01
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** INFRA-001
- **Acceptance Criteria:**
  - تشغيل PostgreSQL/Redis/RabbitMQ/MinIO عبر Docker.
  - Health checks للخدمات تعمل خلال أقل من 60 ثانية.

### INFRA-003 — Migration & Seed Framework
- **Type:** Story
- **Epic:** EPIC-01
- **SP:** 3
- **Priority:** High
- **Dependencies:** INFRA-002
- **Acceptance Criteria:**
  - أوامر `migrate:up`, `migrate:down`, `seed:run` تعمل محليًا.
  - أول migration تجريبي يطبق ويرجع بدون أخطاء.

### INFRA-004 — API Observability Baseline
- **Type:** Story
- **Epic:** EPIC-01
- **SP:** 3
- **Priority:** High
- **Dependencies:** INFRA-001
- **Acceptance Criteria:**
  - `requestId` في كل log.
  - endpoints: `/health/live`, `/health/ready`.

### INFRA-005 — OpenAPI Auto Generation
- **Type:** Story
- **Epic:** EPIC-01
- **SP:** 2
- **Priority:** High
- **Dependencies:** INFRA-001
- **Acceptance Criteria:**
  - ملف OpenAPI يتم توليده تلقائيًا من API.
  - build يفشل إذا الـschema غير صالحة.

### CI-001 — CI Quality Gates
- **Type:** Story
- **Epic:** EPIC-01
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** INFRA-001
- **Acceptance Criteria:**
  - PR checks تشمل lint + test + build + SAST.
  - لا يمكن merge عند فشل أي check.

### MQ-001 — Outbox Skeleton + Publisher
- **Type:** Story
- **Epic:** EPIC-08
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** INFRA-002, INFRA-003
- **Acceptance Criteria:**
  - جدول outbox جاهز.
  - worker يسحب من outbox وينشر لـRabbitMQ.
  - فشل النشر لا يفقد الحدث.

---

## 4) Sprint 1 (Auth / RBAC / Tenant Security)

### AUTH-001 — Owner Registration
- **Type:** Story
- **Epic:** EPIC-02
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** INFRA-003
- **Acceptance Criteria:**
  - `POST /auth/register-owner` ينشئ store + owner transactionally.
  - منع تكرار البريد.

### AUTH-002 — Login/Refresh/Logout + Rotation
- **Type:** Story
- **Epic:** EPIC-02
- **SP:** 8
- **Priority:** Highest
- **Dependencies:** AUTH-001
- **Acceptance Criteria:**
  - Access/Refresh tokens يعملان.
  - refresh token rotation مفعلة.
  - logout يبطل الجلسة فورًا.

### RBAC-001 — Roles & Permission Guards
- **Type:** Story
- **Epic:** EPIC-02
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** AUTH-002
- **Acceptance Criteria:**
  - أدوار `owner/staff` وصلاحيات granular.
  - endpoint محمي يفشل بـ403 عند نقص الصلاحية.

### TENANT-001 — Tenant Guard Enforcement
- **Type:** Story
- **Epic:** EPIC-02
- **SP:** 8
- **Priority:** Highest
- **Dependencies:** RBAC-001
- **Acceptance Criteria:**
  - كل query مقيّدة بـ`storeId`.
  - اختبارات تمنع cross-tenant data leakage.

### STORE-001 — Store Settings APIs
- **Type:** Story
- **Epic:** EPIC-02
- **SP:** 3
- **Priority:** High
- **Dependencies:** AUTH-002
- **Acceptance Criteria:**
  - `GET/PUT /store/settings` تعمل وتدقق المدخلات.

### AUDIT-001 — Sensitive Audit Logs
- **Type:** Story
- **Epic:** EPIC-02
- **SP:** 3
- **Priority:** High
- **Dependencies:** AUTH-002
- **Acceptance Criteria:**
  - تسجيل أحداث حساسة: login fail, role change, settings update.

### SEC-001 — Auth Security Hardening
- **Type:** Story
- **Epic:** EPIC-02
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** AUTH-002
- **Acceptance Criteria:**
  - `argon2` لتشفير كلمات المرور.
  - rate-limit + brute-force protection على login.

---

## 5) Sprint 2 (Catalog / Inventory / Media)

### CAT-001 — Categories CRUD
- **Type:** Story
- **Epic:** EPIC-03
- **SP:** 3
- **Priority:** High
- **Dependencies:** STORE-001
- **Acceptance Criteria:**
  - CRUD كامل للتصنيفات مع slug unique per store.

### CAT-002 — Products CRUD
- **Type:** Story
- **Epic:** EPIC-03
- **SP:** 8
- **Priority:** Highest
- **Dependencies:** CAT-001
- **Acceptance Criteria:**
  - Draft/Active/Archived status.
  - slug unique per store.

### CAT-003 — Variants & SKU Rules
- **Type:** Story
- **Epic:** EPIC-03
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** CAT-002
- **Acceptance Criteria:**
  - إضافة variants لكل منتج.
  - SKU unique per store enforced DB+API.

### INV-001 — Inventory Policy
- **Type:** Story
- **Epic:** EPIC-03
- **SP:** 5
- **Priority:** High
- **Dependencies:** CAT-003
- **Acceptance Criteria:**
  - خصم/تحديث مخزون بطريقة آمنة.
  - منع المخزون السالب.

### MEDIA-001 — Secure Media Upload
- **Type:** Story
- **Epic:** EPIC-03
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** INFRA-002
- **Acceptance Criteria:**
  - allow-list extension + MIME check + size limit.
  - تخزين الملفات في S3-compatible path آمن.

### MEDIA-002 — Thumbnail Worker
- **Type:** Story
- **Epic:** EPIC-03
- **SP:** 5
- **Priority:** Medium
- **Dependencies:** MQ-001, MEDIA-001
- **Acceptance Criteria:**
  - نشر event بعد رفع الصورة.
  - consumer يولد thumbnail مع retry/DLQ.

### QA-001 — Unit Tests for Core Rules
- **Type:** Story
- **Epic:** EPIC-03
- **SP:** 3
- **Priority:** High
- **Dependencies:** CAT-003, INV-001
- **Acceptance Criteria:**
  - tests لـpricing/coupon eligibility/inventory rules.

---

## 6) Sprint 3 (Storefront / Checkout / Orders)

### SF-001 — Host-Based Store Resolution
- **Type:** Story
- **Epic:** EPIC-04
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** TENANT-001
- **Acceptance Criteria:**
  - resolve المتجر من `Host` (subdomain).
  - cache `host -> storeId` باستخدام Redis.

### SF-002 — Public Product APIs
- **Type:** Story
- **Epic:** EPIC-04
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** CAT-002
- **Acceptance Criteria:**
  - `GET /sf/products` + filters.
  - `GET /sf/products/:slug` يعرض تفاصيل كاملة.

### CART-001 — Cart APIs
- **Type:** Story
- **Epic:** EPIC-04
- **SP:** 3
- **Priority:** High
- **Dependencies:** SF-002
- **Acceptance Criteria:**
  - add/update/remove item APIs تعمل وتخزن cart مؤقتًا.

### CHECKOUT-001 — Checkout Transaction
- **Type:** Story
- **Epic:** EPIC-04
- **SP:** 8
- **Priority:** Highest
- **Dependencies:** CART-001, INV-001
- **Acceptance Criteria:**
  - `POST /sf/checkout` ينشئ order transactionally.
  - rollback كامل عند failure.

### ORD-001 — Order Management APIs
- **Type:** Story
- **Epic:** EPIC-04
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** CHECKOUT-001
- **Acceptance Criteria:**
  - list/detail/update-status للطلبات.
  - state machine يمنع الانتقالات غير القانونية.

### MQ-002 — Order Events Publishing
- **Type:** Story
- **Epic:** EPIC-08
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** CHECKOUT-001, MQ-001
- **Acceptance Criteria:**
  - نشر `order.created` و`order.status.changed` عبر outbox.
  - كل رسالة تحمل `correlationId`.

### E2E-001 — Full Purchase Path
- **Type:** Story
- **Epic:** EPIC-04
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** ORD-001
- **Acceptance Criteria:**
  - سيناريو شراء كامل ناجح E2E.

---

## 7) Sprint 4 (Shipping / Promotions / Notifications)

### SHIP-001 — Shipping Zones CRUD
- **Type:** Story
- **Epic:** EPIC-05
- **SP:** 3
- **Priority:** High
- **Dependencies:** STORE-001
- **Acceptance Criteria:**
  - إنشاء/تعديل/حذف مناطق ورسوم شحن.

### SHIP-002 — Shipping Fee Calculation
- **Type:** Story
- **Epic:** EPIC-05
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** SHIP-001, CHECKOUT-001
- **Acceptance Criteria:**
  - checkout يحتسب الرسوم حسب zone بشكل صحيح.

### MKT-001 — Coupons Engine
- **Type:** Story
- **Epic:** EPIC-05
- **SP:** 8
- **Priority:** Highest
- **Dependencies:** CHECKOUT-001
- **Acceptance Criteria:**
  - يدعم `min order`, date window, usage limit.
  - رفض الكوبون غير الصالح برسالة واضحة.

### MKT-002 — Offers Engine (Basic)
- **Type:** Story
- **Epic:** EPIC-05
- **SP:** 5
- **Priority:** High
- **Dependencies:** MKT-001
- **Acceptance Criteria:**
  - offer على product/category/cart basic.

### NOTIF-001 — Notification Consumers
- **Type:** Story
- **Epic:** EPIC-05
- **SP:** 5
- **Priority:** High
- **Dependencies:** MQ-002
- **Acceptance Criteria:**
  - consumer لإشعارات التاجر/العميل عند أحداث الطلب.

### MQ-003 — Retry & DLQ Policies
- **Type:** Story
- **Epic:** EPIC-08
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** NOTIF-001
- **Acceptance Criteria:**
  - exponential backoff retries.
  - DLQ لكل queue حساسة مع monitoring.

### SEC-002 — Webhook Signature & Replay Protection
- **Type:** Story
- **Epic:** EPIC-05
- **SP:** 3
- **Priority:** High
- **Dependencies:** MQ-003
- **Acceptance Criteria:**
  - HMAC signature validation.
  - منع replay عبر timestamp/nonce.

---

## 8) Sprint 5 (Themes / Domains)

### THM-001 — Theme Schema & Storage
- **Type:** Story
- **Epic:** EPIC-06
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** INFRA-003
- **Acceptance Criteria:**
  - `store_themes` مع `draft_config`, `published_config`, `version`.
  - JSON schema validation للsections.

### THM-002 — Draft Update APIs
- **Type:** Story
- **Epic:** EPIC-06
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** THM-001
- **Acceptance Criteria:**
  - `GET/PUT /themes/draft` مع validation.

### THM-003 — Preview Token Flow
- **Type:** Story
- **Epic:** EPIC-06
- **SP:** 3
- **Priority:** High
- **Dependencies:** THM-002
- **Acceptance Criteria:**
  - `POST /themes/preview-token` يولد token صالح بمدة محدودة.

### THM-004 — Publish + Versioning + Rollback
- **Type:** Story
- **Epic:** EPIC-06
- **SP:** 8
- **Priority:** Highest
- **Dependencies:** THM-003
- **Acceptance Criteria:**
  - publish ينقل draft إلى published مع version bump.
  - rollback لإصدار سابق يعمل.

### DOM-001 — Add/Verify Domain
- **Type:** Story
- **Epic:** EPIC-06
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** SF-001
- **Acceptance Criteria:**
  - `POST /domains` + `POST /domains/:id/verify` عبر TXT token.

### DOM-002 — Activate Domain Safely
- **Type:** Story
- **Epic:** EPIC-06
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** DOM-001
- **Acceptance Criteria:**
  - hostname unique على مستوى المنصة.
  - cooldown بعد unlink.

### MQ-004 — Theme/Domain Events
- **Type:** Story
- **Epic:** EPIC-08
- **SP:** 3
- **Priority:** High
- **Dependencies:** THM-004, DOM-002
- **Acceptance Criteria:**
  - نشر `theme.published`, `domain.verified`, `domain.activated` عبر RabbitMQ.

---

## 9) Sprint 6 (SaaS Controls / Go-Live)

### BILL-001 — Plans & Limits Schema
- **Type:** Story
- **Epic:** EPIC-07
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** INFRA-003
- **Acceptance Criteria:**
  - جداول `plans`, `plan_limits`, `store_subscriptions`, `usage_events`.

### BILL-002 — Usage Metering Middleware
- **Type:** Story
- **Epic:** EPIC-07
- **SP:** 5
- **Priority:** High
- **Dependencies:** BILL-001
- **Acceptance Criteria:**
  - احتساب usage للمنتجات/الطلبات/الموظفين.

### BILL-003 — Feature Flags by Plan
- **Type:** Story
- **Epic:** EPIC-07
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** BILL-001
- **Acceptance Criteria:**
  - تمكين/منع ميزات حسب plan (domains/webhooks/staff limits).

### ADMIN-001 — Platform Admin Basic Console
- **Type:** Story
- **Epic:** EPIC-07
- **SP:** 8
- **Priority:** High
- **Dependencies:** BILL-003
- **Acceptance Criteria:**
  - شاشة المتاجر + حالة الاشتراكات + تعليق متجر.

### OBS-001 — Monitoring & Alerts
- **Type:** Story
- **Epic:** EPIC-07
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** INFRA-004
- **Acceptance Criteria:**
  - Sentry + metrics dashboard + تنبيهات errors/latency/queue depth.

### OPS-001 — Backup/Restore Drill
- **Type:** Story
- **Epic:** EPIC-07
- **SP:** 3
- **Priority:** Highest
- **Dependencies:** INFRA-003
- **Acceptance Criteria:**
  - تجربة restore ناجحة موثقة في runbook.

### SEC-003 — Security Regression Suite
- **Type:** Story
- **Epic:** EPIC-07
- **SP:** 5
- **Priority:** Highest
- **Dependencies:** SEC-001, SEC-002
- **Acceptance Criteria:**
  - اختبارات: tenant escape, privilege escalation, malicious upload, replay attacks.

### GO-001 — Release Readiness Gate
- **Type:** Story
- **Epic:** EPIC-07
- **SP:** 3
- **Priority:** Highest
- **Dependencies:** E2E-001, OPS-001, SEC-003
- **Acceptance Criteria:**
  - جميع بنود Go-Live checklist ناجحة.
  - قرار إطلاق موثق.

---

## 10) Tickets جاهزة للبدء هذا الأسبوع

ابدأ بهذه التذاكر فورًا (بنفس الترتيب):

1. `INFRA-001`
2. `INFRA-002`
3. `INFRA-003`
4. `CI-001`
5. `MQ-001`
6. `AUTH-001`
7. `AUTH-002`
8. `RBAC-001`
9. `TENANT-001`
10. `STORE-001`

---

## 11) ملاحظات تشغيلية سريعة

- أي ticket تمس events/notifications/payments/themes publish/domains يجب أن تمر عبر RabbitMQ + Outbox.
- أي endpoint جديد يجب أن يمر عبر DTO validation + RBAC + tenant guard.
- أي feature بدون اختبارات قبول واضحة لا تدخل In Progress.

---

**نهاية Backlog Jira**
