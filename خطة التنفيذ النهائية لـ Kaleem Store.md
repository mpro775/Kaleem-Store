# **خطة التنفيذ النهائية لـ Kaleem Store**

هذه الخطة مبنية على آخر فحص للمشروع بعد التحديثات الأخيرة.  
 الهدف منها هو **إغلاق النواقص المتبقية** وتحويل Kaleem Store من **MVP+/Beta قوي** إلى **نسخة SaaS جاهزة بشكل صحيح للإطلاق**.

---

## **1\) الهدف العام**

نريد الوصول إلى نسخة تحقق الشروط التالية:

* متجر يعمل فعليًا من البداية للنهاية

* لوحة تحكم usable للتاجر

* دومينات مخصصة تعمل مع SSL

* تخزين ملفات مستقر وصحيح

* Webhooks وتكاملات جاهزة

* Build نظيف ومراجعة تشغيلية سليمة

* تغطية اختبارية كافية لأهم المسارات

* أساس SaaS أكثر نضجًا

---

## **2\) ترتيب التنفيذ المقترح**

### **المرحلة الأولى: Critical Fixes**

هذه المرحلة لا بد أن تُغلق أولًا قبل أي توسعات إضافية:

1. Build verification

2. Custom domains \+ SSL

3. Webhooks

4. Storage health & operational checks

5. Store policies

### **المرحلة الثانية: Product Completion**

بعد إغلاق النقاط الحرجة ننتقل إلى إكمال الميزات الجزئية:

6. Advanced offers

7. Theme system maturity

8. SaaS metering enforcement

9. Test expansion

### **المرحلة الثالثة: Growth Features**

هذه ليست blocker للإطلاق الأساسي، لكنها مهمة بعد الإطلاق أو قبله إذا أردتم SaaS أقوى:

10. Abandoned carts

11. Reviews / FAQ

12. Multi-warehouse

---

# **3\) خطة التنفيذ التفصيلية**

---

## **3.1 Build Clean Verification**

### **الحالة الحالية**

المنظومة متقدمة جدًا، لكن التحقق البنائي النهائي ما زال يحتاج تثبيت، وظهر خلل متعلق بـ TypeScript / node types.

### **الهدف**

الوصول إلى:

* API build clean

* Admin build clean

* Storefront build clean

* workspace install/build/test يعمل بدون أخطاء واضحة

### **المهام**

* مراجعة `package.json` في الجذر وفي كل app

* مراجعة `tsconfig` في:

  * `apps/api`

  * `apps/admin`

  * `apps/storefront`

  * `packages/shared-types`

* التأكد من وجود:

  * `@types/node`

  * وربطه الصحيح داخل `types`

* توحيد إعدادات TypeScript بين التطبيقات

* تشغيل:

  * install clean

  * typecheck

  * build

* حل أي dependency mismatches في الـworkspace

### **المخرجات**

* تشغيل build نظيف لكل التطبيقات

* توثيق أوامر التشغيل والبناء النهائية

### **Definition of Done**

* `api` يبني بدون أخطاء

* `admin` يبني بدون أخطاء

* `storefront` يبني بدون أخطاء

* التحقق البنائي موثق ويمكن تكراره بسهولة

---

## **3.2 Custom Domains \+ SSL**

### **الحالة الحالية**

منطق الدومينات موجود جيدًا على مستوى API وDB، لكن التشغيل الفعلي مع SSL ما زال غير مكتمل.

### **الهدف**

جعل الدومين المخصص يعمل فعليًا مع HTTPS بشكل صحيح.

### **المهام**

#### **أولًا: backend / domain logic**

* مراجعة lifecycle الكامل:

  * create

  * verify

  * activate

  * deactivate/delete

* التأكد من صحة `sslStatus` و `routingTarget`

* إضافة أي endpoints داخلية مطلوبة للـproxy إذا لزم

#### **ثانيًا: infrastructure**

اختيار أحد المسارين بشكل نهائي:

* Cloudflare

* أو Reverse Proxy \+ ACME مثل:

  * Traefik

  * Caddy

  * Nginx \+ Certbot

#### **إذا اخترتم Cloudflare**

* توثيق flow النهائي:

  * CNAME/TXT

  * verification

  * activation

* ربط المنصة مع Cloudflare عند الحاجة

* اختبار دومين مخصص فعلي

#### **إذا اخترتم Proxy/ACME**

* إعداد proxy routing حسب `Host`

* إصدار شهادة SSL تلقائيًا

* اختبار renewals

* اختبار ربط أكثر من متجر

### **المخرجات**

* دومين مخصص يعمل فعليًا

* HTTPS سليم

* حل موثق للتفعيل والإدارة

### **Definition of Done**

* متجر يعمل على subdomain

* متجر يعمل على custom domain

* SSL صالح ويعمل تلقائيًا

* lifecycle الدومين واضح ومختبر

---

## **3.3 Webhooks Feature Completion**

### **الحالة الحالية**

يوجد migration \+ webhook signing service، لكن feature كاملة غير موجودة بعد.

### **الهدف**

بناء Webhooks بشكل إنتاجي حتى تصبح التكاملات لاحقًا ممكنة.

### **المهام**

* إنشاء:

  * `webhooks.module`

  * `webhooks.controller`

  * `webhooks.service`

  * `webhooks.repository`

* دعم:

  * subscriptions CRUD

  * اختيار event types

  * delivery logs

  * retries

  * failure status

* استخدام HMAC signing فعلي

* إضافة replay protection إذا لزم

* ربط events الأساسية:

  * product.created

  * product.updated

  * order.created

  * order.updated

  * inventory.updated

  * coupon.updated

### **المخرجات**

* Webhooks usable من داخل Admin

* سجل deliveries واضح

* retries منضبطة

### **Definition of Done**

* المتجر يستطيع تسجيل webhook endpoint

* النظام يرسل events فعلية

* logs والـretries تعمل

* اختبارات end-to-end موجودة

---

## **3.4 Storage Health & Operational Readiness**

### **الحالة الحالية**

التخزين نفسه متقدم، لكن health check التشغيلي غير مكتمل.

### **الهدف**

ضمان أن التخزين يعمل بشكل موثوق إنتاجيًا.

### **المهام**

* إكمال storage health check

* التأكد من:

  * presigned upload flow

  * confirm flow

  * retrieval/public URL behavior

* التحقق من دعم:

  * MinIO محليًا

  * R2/S3 في staging/production

* فحص:

  * نوع الملفات

  * حجم الملفات

  * error handling

* إضافة monitoring/logging للأخطاء المتعلقة بالتخزين

### **المخرجات**

* storage health endpoint فعلي

* runbook واضح للتخزين

### **Definition of Done**

* التخزين يظهر healthy

* رفع وعرض الملفات يعملان بثبات

* الخطأ في التخزين قابل للرصد والمتابعة

---

## **3.5 Store Policies**

### **الحالة الحالية**

migration موجودة لكن التنفيذ الكامل داخل API/UI غير واضح بعد.

### **الهدف**

إكمال سياسات المتجر كجزء أساسي من SaaS والمتجر العام.

### **المهام**

* إضافة دعم API لـ:

  * shipping policy

  * return policy

  * privacy policy

  * terms & conditions

* تحديث Store settings DTOs و service

* إضافة صفحات داخل Admin لتعديل هذه السياسات

* إضافة صفحات عامة داخل Storefront لعرضها

* ربطها بالثيم أو الـfooter حسب الحاجة

### **المخرجات**

* إدارة كاملة لسياسات المتجر

* صفحات عامة قابلة للوصول

### **Definition of Done**

* التاجر يستطيع تحرير السياسات

* العميل يستطيع قراءة الصفحات من المتجر

* المحتوى يظهر بشكل صحيح في الواجهة

---

# **4\) المرحلة الثانية: Product Completion**

---

## **4.1 Advanced Offers**

### **الحالة الحالية**

يوجد constants وDTOs فقط تقريبًا، لكن التنفيذ الكامل غير موجود.

### **الهدف**

تحويل advanced offers إلى ميزة مكتملة.

### **المهام**

* إنشاء module/controller/service/repository

* تحديد حالات الاستخدام المدعومة:

  * buy X get Y

  * tiered discount

  * bundle rules

  * auto applied offers

* ربطها مع checkout/pricing logic

* إضافة إدارة لها في Admin

* اختبار تعارض الخصومات وترتيب الأولويات

### **المخرجات**

* نظام عروض متقدم قابل للإدارة

### **Definition of Done**

* يمكن إنشاء advanced offer من اللوحة

* الخصم يطبق بشكل صحيح في checkout

* توجد اختبارات واضحة للحالات المختلفة

---

## **4.2 Theme System Maturity**

### **الحالة الحالية**

الثيمات تعمل لكنها ما زالت MVP.

### **الهدف**

رفع Theme Engine من MVP إلى مستوى SaaS أقوى.

### **المهام**

* توسيع عدد sections

* إضافة blocks أكثر مرونة

* تحسين theme editor داخل Admin

* دعم صفحات إضافية:

  * product page sections

  * category page sections

  * static pages

* تحسين validation / versioning / fallback behavior

* تحسين preview/publish UX

### **المخرجات**

* Theme Builder أكثر نضجًا

* تنوع أكبر في القوالب

### **Definition of Done**

* التاجر يستطيع تخصيص صفحات المتجر بدرجة أعلى

* الثيمات لا تكسر الواجهة عند القيم غير الصحيحة

* التغيير يظهر بشكل متوقع في preview/publish

---

## **4.3 SaaS Metering Enforcement**

### **الحالة الحالية**

القياسات موجودة جزئيًا، لكن enforcement ليس كاملاً في كل المسارات.

### **الهدف**

جعل الخطط والحدود تعمل فعليًا على مستوى المنتج.

### **المهام**

* مراجعة كل metrics الحالية:

  * products.total

  * orders.monthly

  * staff.total

  * domains.total

  * storage.used

  * api\_calls.monthly

  * webhooks.monthly

* التحقق من increment/decrement الصحيح

* ربط limits enforcement بالـguards/services

* إضافة رسائل واضحة عند تجاوز الحدود

* توضيح behavior عند:

  * trial expiry

  * downgrade

  * suspension

### **المخرجات**

* خطط SaaS فعالة وليست فقط metadata

### **Definition of Done**

* تجاوز limit يمنع أو يقيّد السلوك بشكل صحيح

* كل usage metrics المهمة مفعّلة

* الإدارة ترى usage واضحًا في platform admin

---

## **4.4 Test Expansion**

### **الحالة الحالية**

الاختبارات تحسنت، لكن ما زالت جزئية.

### **الهدف**

توسيع الاختبارات لأكثر المسارات حساسية.

### **المهام**

* إضافة اختبارات لـ:

  * webhooks end-to-end

  * advanced offers

  * policies

  * payment receipts workflow

  * custom domain flow

  * storefront theme rendering

* تغطية:

  * success paths

  * invalid input

  * permission failures

  * tenant isolation

* مراجعة smoke tests الشاملة

### **المخرجات**

* مصفوفة اختبار أكثر نضجًا

### **Definition of Done**

* أهم المسارات التجارية مغطاة

* regressions أسهل في الاكتشاف

* يوجد smoke suite معتمد قبل الإطلاق

---

# **5\) المرحلة الثالثة: Growth Features**

---

## **5.1 Abandoned Carts**

### **الحالة الحالية**

migration موجودة، لكن feature غير مكتملة.

### **الهدف**

إضافة استرجاع السلات المتروكة كميزة نمو.

### **المهام**

* إنشاء module/service/controller

* تسجيل حالة cart abandonment

* job/background worker لمعالجة السلات المتروكة

* إرسال إشعار أو trigger لاحقًا

* واجهة إدارة أو تقارير داخل Admin

### **Definition of Done**

* cart المتروكة تُرصد وتظهر

* يوجد أساس لإشعارات الاسترجاع

---

## **5.2 Reviews / FAQ**

### **الحالة الحالية**

migration فقط تقريبًا.

### **الهدف**

إضافة طبقة ثقة ومحتوى للمتجر.

### **المهام**

* Reviews module

* FAQ module

* ربطها بالمنتجات أو المتجر

* إدارة من Admin

* عرض في Storefront

* moderation بسيط عند الحاجة

### **Definition of Done**

* يمكن إضافة وإدارة reviews وFAQ

* تظهر في الواجهة العامة

---

## **5.3 Multi-Warehouse**

### **الحالة الحالية**

migration موجودة لكن التنفيذ غير مكتمل.

### **الهدف**

تهيئة النظام لتعدد المستودعات عند الحاجة.

### **المهام**

* تصميم domain logic

* ربط inventory بالمستودعات

* تخصيص stock per warehouse

* تحديث fulfillment/shipping rules

* إضافة إدارة من Admin

### **Definition of Done**

* المتجر يستطيع العمل بأكثر من warehouse

* المخزون ينعكس بشكل صحيح حسب المستودع

---

# **6\) خطة التنفيذ العملية المقترحة**

## **Sprint / Batch 1**

* Build clean verification

* Storage health

* Store policies

## **Sprint / Batch 2**

* Custom domains \+ SSL

* Webhooks

## **Sprint / Batch 3**

* Advanced offers

* SaaS metering enforcement

* Test expansion

## **Sprint / Batch 4**

* Theme maturity improvements

## **Sprint / Batch 5**

* Abandoned carts

* Reviews / FAQ

## **Sprint / Batch 6**

* Multi-warehouse

---

# **7\) ترتيب الأولوية النهائي**

## **Critical**

* Build clean verification

* Custom domains \+ SSL

* Webhooks

* Storage health

* Store policies

## **High**

* Advanced offers

* SaaS metering enforcement

* Test expansion

* Theme maturity

## **Medium**

* Abandoned carts

* Reviews / FAQ

## **Later**

* Multi-warehouse

---

# **8\) Definition of Ready قبل الإطلاق**

لا نعتبر المشروع جاهزًا بشكل صحيح حتى تتحقق الشروط التالية:

* build clean لكل التطبيقات

* custom domains تعمل مع SSL فعلي

* webhooks مكتملة

* storage operational checks مكتملة

* store policies موجودة API/UI/Storefront

* advanced offers أو قرار واضح بتأجيلها

* test suite كافية للمسارات الأساسية

* theme system مستقر بما يكفي للاستخدام الفعلي

* metering/limits تعمل على الأقل للخطط الأساسية

---

# **9\) النتيجة المتوقعة بعد تنفيذ الخطة**

بعد إغلاق هذه الخطة، ينتقل Kaleem Store من:

**MVP+/Beta قوي جدًا**

إلى:

**SaaS Store Platform جاهزة بشكل صحيح للإطلاق والتشغيل الفعلي**

