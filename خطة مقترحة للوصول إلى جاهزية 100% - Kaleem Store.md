# الخطة المقترحة للوصول إلى جاهزية 100% — Kaleem Store

هذه الخطة مبنية على تقرير الفحص النهائي والخطة السابقة، وتهدف إلى نقل Kaleem Store من حالة **MVP+/Beta قوي** إلى **منصة SaaS جاهزة للإطلاق التشغيلي بثقة**.

---

## 1) الهدف التنفيذي

الوصول إلى **جاهزية إطلاق 100%** عبر إغلاق:

- جميع عناصر **Critical** التشغيلية
- جميع عناصر **High** أو اعتماد قرار تأجيل رسمي موثق لها
- تثبيت جودة البناء والاختبارات والمراقبة والأمان في بيئة تشغيل فعلية

> ملاحظة: ميزات النمو (Abandoned Carts / Reviews-FAQ / Multi-Warehouse) ليست مانعة للإطلاق الأساسي إلا إذا تم اعتمادها ضمن نطاق الإصدار الأول.

---

## 2) تعريف 100% (Release Readiness Gate)

لا نعتبر المنصة جاهزة 100% حتى تتحقق الشروط التالية:

1. Build clean كامل لتطبيقات `api` و`admin` و`storefront`.
2. Custom domains تعمل فعليًا مع SSL تلقائي.
3. Webhooks مكتملة (اشتراكات + إرسال + retries + logs + signing).
4. Storage health check فعلي + مراقبة أخطاء واضحة.
5. Store policies مكتملة عبر API + Admin + Storefront.
6. SaaS metering enforcement مفعل في المسارات الأساسية.
7. Test suite تغطي المسارات التجارية الحساسة وتعمل باستقرار.
8. Security hardening وObservability مثبتة في بيئة تشغيل حقيقية.

---

## 3) خارطة التنفيذ المرحلية

## المرحلة 0: تثبيت خط الأساس (5–7 أيام)

### النطاق

- حل مشاكل البناء الحالية (خصوصًا TypeScript / `@types/node`).
- توحيد إعدادات `tsconfig` عبر المشاريع.
- اعتماد CI pipeline إلزامي: `install -> typecheck -> build -> smoke e2e`.
- توثيق أوامر التشغيل والبناء الرسمية في Runbook واحد.

### المخرجات

- Build نظيف 100% لكل التطبيقات.
- خط CI ثابت وقابل للتكرار.

### Definition of Done

- نجاح build متكرر بدون تدخل يدوي.
- توثيق خطوات التحقق بشكل واضح ومحدث.

---

## المرحلة 1: إغلاق Blockers الحرجة (10–14 يوم)

### النطاق

1. **Storage Health & Operational Checks**
   - استكمال health endpoint فعلي للتخزين.
   - التحقق من upload/confirm/retrieval عبر MinIO محليًا وR2/S3 في staging/production.
   - تحسين observability لأخطاء التخزين.

2. **Store Policies Completion**
   - API كاملة لسياسات: الشحن، الاسترجاع، الخصوصية، الشروط.
   - صفحات تحرير في Admin.
   - صفحات عرض عامة في Storefront + ربط بالواجهة.

3. **Webhooks Completion**
   - بناء module/controller/service/repository كاملة.
   - subscriptions CRUD + event selection.
   - delivery logs + retries + failure states.
   - HMAC signing + replay protection (عند الحاجة).
   - ربط أحداث أساسية: orders/products/inventory/coupons.

### المخرجات

- سياسات المتجر تعمل end-to-end.
- Webhooks جاهزة للاستخدام والتكامل.
- التخزين قابل للرصد التشغيلي.

### Definition of Done

- متجر قادر على إدارة السياسات وعرضها للعملاء.
- webhook endpoint يستقبل أحداث فعلية مع retries موثقة.
- storage health يظهر حالة موثوقة في البيئة الفعلية.

---

## المرحلة 2: Custom Domains + SSL (10–14 يوم)

### قرار معماري إلزامي

اختيار مسار واحد نهائيًا:

- Cloudflare API Integration
- أو Reverse Proxy + ACME (Traefik/Caddy/Nginx+Certbot)

### النطاق

- إكمال lifecycle: create/verify/activate/deactivate/delete.
- ربط `sslStatus` و`routingTarget` بحالة تشغيلية فعلية.
- تفعيل إصدار وتجديد SSL تلقائي.
- اختبار سيناريوهات multi-tenant domains.

### المخرجات

- دومين مخصص يعمل مع HTTPS تلقائيًا.
- وثائق تشغيل واضحة للفريق.

### Definition of Done

- Subdomain + Custom Domain كلاهما يعملان فعليًا.
- SSL صالح، تلقائي، ومجرب renewal.

---

## المرحلة 3: نضج المنتج SaaS (10–14 يوم)

### النطاق

1. **SaaS Metering Enforcement**
   - تفعيل العدادات: products, orders, staff, domains, storage, api_calls, webhooks.
   - فرض limits في المسارات الحرجة (guards/services).
   - رسائل واضحة عند تجاوز الحدود.
   - ضبط حالات trial expiry / downgrade / suspension.

2. **Advanced Offers**
   - تنفيذ كامل للميزة (module/controller/service/repository).
   - إطلاق نطاق أول واضح: Buy X Get Y + Tiered Discount.
   - ربط مع pricing/checkout واختبار تعارض الخصومات.

3. **Theme Maturity (الحد المؤثر على الإطلاق)**
   - تحسين الاستقرار (preview/publish/validation/fallback).
   - توسيع sections الأساسية المؤثرة على التحويل والمحتوى.

### المخرجات

- خطط SaaS مفروضة فعليًا.
- عروض متقدمة قابلة للإدارة.
- ثيمات أكثر استقرارًا للاستخدام التجاري.

### Definition of Done

- limit enforcement مثبت end-to-end.
- advanced offers تطبق بدقة في checkout.
- تغيير الثيم لا يسبب كسرًا وظيفيًا في الواجهة.

---

## المرحلة 4: جاهزية الإطلاق النهائية (7–10 أيام)

### النطاق

- توسيع E2E للمسارات الحساسة:
  - webhooks
  - payment receipts workflow
  - custom domains flow
  - policies pages
  - storefront theme rendering
- مراجعة Security/Observability في بيئة تشغيل حقيقية.
- إعداد Go-Live Checklist + Rollback Plan + Incident Runbook.

### المخرجات

- حزمة إطلاق موثقة وقابلة للتنفيذ.
- readiness review نهائي مبني على أدلة تشغيلية.

### Definition of Done

- اجتياز smoke/regression المعتمدة قبل الإطلاق.
- عدم وجود قضايا P0/P1 مفتوحة.

---

## 4) Streams التنفيذ المتوازي (لتقليل الزمن)

### Stream A — Core Stability

- Build verification
- Storage health
- Store policies

### Stream B — Integrations & Edge

- Webhooks completion
- Domains + SSL execution

### Stream C — Product & SaaS

- Metering enforcement
- Advanced offers
- Theme maturity

### Stream D — Quality & Launch

- E2E expansion
- Security hardening
- Observability verification
- Go-live readiness

---

## 5) الأولويات النهائية

### Critical

- Build clean verification
- Custom domains + SSL
- Webhooks
- Storage health
- Store policies

### High

- SaaS metering enforcement
- Advanced offers
- Test expansion
- Theme maturity (scope مؤثر على الإطلاق)

### Growth (Non-Blocking)

- Abandoned carts
- Reviews / FAQ
- Multi-warehouse

---

## 6) مؤشرات القياس (KPIs) لاعتماد الجاهزية

1. **Build Success Rate:** 100% على branch الإطلاق.
2. **Critical E2E Pass Rate:** >= 95% بثبات.
3. **Webhook Delivery Success:** >= 99% مع retries فعالة.
4. **SSL Provisioning Time:** ضمن SLA متفق عليه (مثال: أقل من 15 دقيقة).
5. **Incident Visibility:** كل أخطاء التخزين والدومينات والويبهوكس مرصودة بمؤشرات وتنبيهات.
6. **Release Blocking Bugs:** صفر قضايا P0/P1 قبل go-live.

---

## 7) الجدول الزمني المقترح

- الأسبوع 1: المرحلة 0
- الأسبوع 2–3: المرحلة 1
- الأسبوع 4–5: المرحلة 2
- الأسبوع 6–7: المرحلة 3
- الأسبوع 8: المرحلة 4

> المدة الإجمالية المتوقعة: **8 أسابيع** (قابلة للضغط مع التنفيذ المتوازي وتوفر الموارد).

---

## 8) المخاطر الرئيسية وخطة التعامل

1. **تأخر قرار بنية Domains/SSL**
   - المعالجة: قرار معماري خلال 48 ساعة كحد أقصى.

2. **تعقيد Webhooks retries/idempotency**
   - المعالجة: اعتماد outbox pattern القياسي + اختبارات ضغط مبكرة.

3. **ضعف تغطية الاختبارات في المسارات الحرجة**
   - المعالجة: أولوية E2E للـCritical قبل أي ميزات نمو.

4. **اختلاف إعدادات البيئات (dev/staging/prod)**
   - المعالجة: runbooks موحدة + verification checklist لكل بيئة.

---

## 9) القرار التنفيذي المقترح

للوصول إلى 100% بشكل واقعي وآمن:

- نبدأ فورًا بالمرحلة 0 و1 دون تأخير.
- نعتمد قرار Domains/SSL معماريًا مبكرًا لتفادي تعطيل الجدول.
- نعامل اختبارات الـCritical كبوابة إطلاق إلزامية لا اختيارية.
- نرحّل ميزات النمو غير المانعة للإطلاق إلى Sprint لاحق بعد go-live.

بهذا التنفيذ، ينتقل Kaleem Store من **Beta قوي** إلى **منصة SaaS جاهزة للإطلاق التشغيلي بثقة**.
