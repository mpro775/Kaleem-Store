# PRD تنفيذي احترافي
## Kaleem Platform Admin Console

### حالة المستند
- الإصدار: 1.0
- النوع: Product Requirements Document (PRD)
- الغرض: تحويل لوحة كليم الداخلية إلى منصة تشغيل وإدارة وحوكمة متكاملة لفريق كليم
- نطاق المستند: لوحة كليم الداخلية فقط، وليس لوحة التاجر أو واجهة المتجر

---

## 1. الملخص التنفيذي

يهدف هذا المستند إلى تعريف المتطلبات التنفيذية الكاملة لبناء **لوحة كليم الداخلية** بحيث تصبح مركز التحكم الرئيسي في المنصة، وتُمكّن فريق كليم من إدارة المتاجر، الخطط، الاشتراكات، الدومينات، الصحة التشغيلية، السجلات الإدارية، وصلاحيات الفريق من مكان واحد.

المشروع الحالي يحتوي بالفعل على أساس قوي في الباك إند لمنطق الـ SaaS وإدارة المنصة، كما يحتوي على لوحة تاجر متقدمة وغنية. لكن ما يزال ينقصه **Platform Admin Console** حقيقية وقابلة للتشغيل اليومي على مستوى فريق كليم.

الهدف النهائي ليس بناء صفحة أدمن بسيطة، بل بناء **Operational Control Center** يربط بين التشغيل التجاري، الحوكمة، الصحة التقنية، ومتابعة نجاح المتاجر.

---

## 2. الخلفية والوضع الحالي

### 2.1 ما هو الموجود فعليًا في المشروع

من خلال السورس الحالي، المشروع يتضمن:

- `apps/api` باك إند NestJS
- `apps/admin` لوحة الإدارة الحالية
- `apps/storefront` واجهة المتجر
- وحدات فعلية قوية في الباك إند مثل:
  - `stores`
  - `products`
  - `orders`
  - `payments`
  - `domains`
  - `themes`
  - `analytics`
  - `saas`
  - `observability`
  - `audit`

كما توجد نواة حقيقية لإدارة المنصة ضمن:
- `apps/api/src/saas/platform-admin.controller.ts`

وفي الفرونت توجد صفحة أولية مرتبطة بالمنصة ضمن:
- `apps/admin/src/features/platform-console.tsx`

### 2.2 الفجوة الحالية

الموجود في الفرونت ليس لوحة تشغيل داخلية حقيقية، بل واجهة أولية تعريفية. لذلك توجد فجوة واضحة بين:

- **قدرات الباك إند الحالية**
- و**الواجهة الداخلية المطلوبة لفريق كليم**

---

## 3. الهدف من المنتج

### 3.1 الهدف الرئيسي

بناء لوحة داخلية متكاملة لفريق كليم تمكّنه من:

- إدارة المتاجر بالكامل على مستوى المنصة
- إدارة الخطط والاشتراكات
- مراقبة الدومينات وSSL
- تتبع النشاطات والإجراءات الإدارية
- مراقبة صحة المنصة تقنيًا
- إدارة صلاحيات فريق كليم
- متابعة نجاح المتاجر وتقدمها
- تشغيل المنصة بطريقة قابلة للتوسع

### 3.2 الأهداف الفرعية

- تقليل الأعمال اليدوية
- توحيد مصادر القرار في مكان واحد
- تقليل وقت الاستجابة للمشكلات
- تحسين الحوكمة والتدقيق
- تجهيز المنصة للنمو المستقبلي

### 3.3 ما لا يشمله هذا المستند

هذا المستند لا يغطي:

- لوحة التاجر نفسها
- واجهة المتجر للعملاء
- محرر الثيمات التفصيلي
- نظام دعم خارجي كامل متعدد القنوات
- نظام CRM متقدم جدًا

---

## 4. تعريفات أساسية

### 4.1 Platform Admin Console
هي لوحة التشغيل الداخلية الخاصة بفريق كليم، وتختلف عن لوحة التاجر.

### 4.2 Store 360
صفحة موحدة تعرض كل ما يخص متجرًا معينًا من منظور فريق كليم.

### 4.3 Internal Note
ملاحظة داخلية يضيفها أحد أعضاء فريق كليم على متجر أو حالة تشغيلية.

### 4.4 Platform Alert
تنبيه تشغيلي أو تقني أو تجاري يظهر لفريق كليم داخل اللوحة.

---

## 5. الشخصيات المستهدفة داخل فريق كليم

### 5.1 Super Admin
يمتلك أعلى مستوى من الصلاحيات.

### 5.2 Operations Manager
مسؤول تشغيل المنصة والمتابعة اليومية.

### 5.3 Merchant Success
مسؤول متابعة نجاح المتاجر والتفعيل والاحتفاظ.

### 5.4 Support Agent
مسؤول التعامل مع مشاكل التجار التشغيلية.

### 5.5 Finance Admin
مسؤول الخطط، الاشتراكات، التحصيل، والحالات المالية.

### 5.6 Technical Admin
مسؤول الصحة التقنية، الدومينات، الخدمات، الحوادث.

### 5.7 Auditor / Read Only
صلاحية للعرض فقط دون تنفيذ تغييرات.

---

## 6. نطاق الإصدار المستهدف

### 6.1 الإصدار الأول الاحترافي المطلوب

يشمل الأقسام التالية:

1. Authentication & RBAC
2. Platform Shell
3. Dashboard
4. Stores
5. Store 360
6. Plans
7. Subscriptions
8. Domains & SSL
9. Audit Logs
10. Team & Roles
11. Health & Incidents
12. Onboarding & Success
13. Global Settings

### 6.2 الإصدار الثاني لاحقًا

1. Platform Analytics المتقدمة
2. Automation Center
3. Support Center داخلي متكامل
4. Risk & Compliance
5. Financial Ops المتقدمة

---

## 7. المبادئ غير الوظيفية

### 7.1 الأمن
- كل مسارات المنصة محمية بتوثيق داخلي حقيقي
- كل إجراء حساس يجب أن يخضع لصلاحيات دقيقة
- تسجيل Audit لكل العمليات الحساسة
- عدم الاعتماد على secret header فقط في الفرونت

### 7.2 القابلية للتوسع
- قابلية إدارة مئات وآلاف المتاجر لاحقًا
- صفحات قابلة للفلترة والبحث والصفحات المتعددة
- تصميم بنية API modular

### 7.3 القابلية للصيانة
- فصل واضح بين platform و merchant داخل الفرونت
- فصل أو تنظيم منطقي داخل الباك إند
- توثيق ثابت للعقود البرمجية

### 7.4 الأداء
- Pagination لجميع الجداول الكبيرة
- Filtering على مستوى الباك إند
- Caching مدروس لبعض الـ summaries

### 7.5 التتبع
- كل إجراء حساس قابل للتتبع
- ربط النشاطات بالمسؤول وبالوقت وبالمتجر المستهدف

---

## 8. المعمارية المقترحة

## 8.1 الفرونت

داخل `apps/admin` يوصى بإنشاء:

```text
src/features/platform/
├── api/
├── components/
├── guards/
├── hooks/
├── layouts/
├── pages/
│   ├── dashboard/
│   ├── stores/
│   ├── store-details/
│   ├── plans/
│   ├── subscriptions/
│   ├── domains/
│   ├── audit/
│   ├── health/
│   ├── onboarding/
│   ├── team/
│   └── settings/
├── types/
└── utils/
```

### 8.2 الباك إند

داخل `apps/api` يوصى بتنظيم وحدات المنصة إلى:

```text
platform-admin-auth/
platform-admin-users/
platform-dashboard/
platform-stores/
platform-subscriptions/
platform-domains/
platform-health/
platform-audit/
platform-onboarding/
platform-settings/
```

يمكن إبقاء بعض المنطق ضمن `saas` عند الحاجة، لكن يفضّل تدريجيًا الفصل المنطقي.

---

## 9. التنقل الرئيسي للوحة

القائمة الجانبية المقترحة:

1. Dashboard
2. Stores
3. Onboarding & Success
4. Plans
5. Subscriptions
6. Domains & SSL
7. Health & Incidents
8. Audit Logs
9. Team & Roles
10. Global Settings

إضافات مستقبلية:
- Platform Analytics
- Support Center
- Risk & Compliance
- Automation Center

---

## 10. المتطلبات الوظيفية التفصيلية

## 10.1 Authentication & RBAC

### الهدف
تمكين أعضاء فريق كليم من تسجيل الدخول والوصول إلى لوحة المنصة وفق أدوار وصلاحيات دقيقة.

### المتطلبات
- صفحة تسجيل دخول داخلية
- جلسة دخول مستقلة عن التاجر
- إدارة أدوار وصلاحيات
- Route guards في الفرونت
- Permission checks في الباك إند

### الحقول المطلوبة في صفحة الدخول
- البريد الإلكتروني
- كلمة المرور
- تذكرني مستقبلًا إن لزم

### المخرجات
- Session/JWT صالح
- بيانات المسؤول وصلاحياته

### حالات الفشل
- بيانات دخول خاطئة
- حساب معطل
- جلسة منتهية
- صلاحية غير كافية

### الصلاحيات الأساسية
- `platform.auth.login`
- `platform.admins.read`
- `platform.admins.write`
- `platform.roles.read`
- `platform.roles.write`

---

## 10.2 Dashboard

### الهدف
عرض ملخص تشغيلي حيّ للمنصة.

### مكونات الصفحة

#### قسم المؤشرات الرئيسية
- إجمالي المتاجر
- المتاجر النشطة
- المتاجر التجريبية
- المتاجر المعلقة
- الاشتراكات النشطة
- الاشتراكات المتعثرة
- الدومينات النشطة
- الدومينات التي بها مشكلات

#### قسم التنبيهات
- تعثرات دفع
- مشاكل دومينات
- متاجر تحتاج متابعة
- حوادث تقنية

#### قسم النشاط الأخير
- آخر الإجراءات الإدارية
- آخر المتاجر التي تم إنشاؤها
- آخر المتاجر المعلقة أو المعاد تفعيلها

#### قسم لقطات نمو
- متاجر جديدة هذا الأسبوع
- متاجر دخلت trial
- متاجر تم تحويلها إلى paid

### الأزرار السريعة
- فتح قائمة المتاجر
- فتح الاشتراكات المتعثرة
- فتح الدومينات المتعثرة
- فتح المتاجر غير المكتملة

### الصلاحيات
- `platform.dashboard.read`

### API Contracts
- `GET /platform/dashboard/summary`
- `GET /platform/dashboard/alerts`
- `GET /platform/dashboard/activity`
- `GET /platform/dashboard/growth`

---

## 10.3 Stores

### الهدف
إدارة كل المتاجر من مستوى المنصة.

### الجدول الرئيسي
الأعمدة:
- اسم المتجر
- slug
- اسم المالك
- البريد
- رقم الهاتف
- حالة المتجر
- الخطة الحالية
- حالة الاشتراك
- عدد المنتجات
- عدد الطلبات
- آخر نشاط
- حالة الدومين
- completion score
- تاريخ الإنشاء

### الفلاتر
- الحالة
- الخطة
- الاشتراك
- وجود دومين/عدم وجوده
- متجر جديد
- غير مكتمل الإعداد
- تاريخ الإنشاء

### العمليات
- عرض التفاصيل
- تعليق متجر
- إعادة تفعيل متجر
- تغيير الخطة
- تمديد trial
- فتح الملاحظات
- فتح الدومينات
- نسخ رابط المتجر
- تصدير النتائج

### الصلاحيات
- `platform.stores.read`
- `platform.stores.write`
- `platform.stores.suspend`
- `platform.stores.resume`

### API Contracts
- `GET /platform/stores`
- `GET /platform/stores/:storeId`
- `POST /platform/stores/:storeId/suspend`
- `POST /platform/stores/:storeId/resume`
- `POST /platform/stores/:storeId/assign-plan`
- `POST /platform/stores/:storeId/extend-trial`

---

## 10.4 Store 360

### الهدف
عرض ملف تشغيلي موحد ومتكامل لكل متجر.

### تبويبات الصفحة

#### التبويب 1: Overview
- الاسم
- الحالة
- المالك
- الخطة
- الاشتراك
- عدد المنتجات
- عدد الطلبات
- آخر نشاط
- مؤشرات مختصرة

#### التبويب 2: Subscription
- الخطة الحالية
- حالة الاشتراك
- تاريخ البداية
- نهاية الفترة الحالية
- trial end
- آخر تغييرات

#### التبويب 3: Domains
- الدومينات المرتبطة
- حالة التحقق
- حالة SSL
- آخر فحص
- المشكلات

#### التبويب 4: Usage
- عدد المنتجات
- الطلبات
- الموظفين
- حدود الخطة والاستهلاك

#### التبويب 5: Activity
- النشاطات الإدارية
- التغييرات الأخيرة
- الأحداث المهمة

#### التبويب 6: Notes
- الملاحظات الداخلية
- الإضافة والتعديل والتثبيت

### الأزرار السريعة
- تعليق متجر
- إعادة تفعيل
- تغيير خطة
- تمديد trial
- إلغاء اشتراك
- استئناف اشتراك
- إضافة note
- فتح الدومينات

### الصلاحيات
- `platform.stores.read`
- `platform.stores.write`
- `platform.notes.read`
- `platform.notes.write`

### API Contracts
- `GET /platform/stores/:storeId`
- `GET /platform/stores/:storeId/usage`
- `GET /platform/stores/:storeId/activity`
- `GET /platform/stores/:storeId/domains`
- `GET /platform/stores/:storeId/subscription`
- `GET /platform/stores/:storeId/notes`
- `POST /platform/stores/:storeId/notes`

---

## 10.5 Plans

### الهدف
إدارة خطط الاشتراك ككيانات حقيقية قابلة للتشغيل والتحكم.

### الحقول الرئيسية للخطة
- الاسم
- code
- الوصف
- السعر
- العملة
- مدة الفوترة
- مفعلة/غير مفعلة
- ترتيب العرض
- حدود الاستخدام
- الخصائص المفعلة

### حدود الخطة الممكنة
- عدد المنتجات
- عدد الطلبات
- عدد الموظفين
- عدد الدومينات
- التخزين
- webhooks
- API access
- advanced analytics
- custom domain
- theme builder
- priority support

### العمليات
- إنشاء خطة
- تعديل خطة
- أرشفة خطة
- نسخ خطة
- تفعيل/تعطيل خطة
- مقارنة الخطط

### الصلاحيات
- `platform.plans.read`
- `platform.plans.write`

### API Contracts
- `GET /platform/plans`
- `POST /platform/plans`
- `PATCH /platform/plans/:planId`
- `POST /platform/plans/:planId/archive`
- `POST /platform/plans/:planId/duplicate`

---

## 10.6 Subscriptions

### الهدف
متابعة كل الاشتراكات على مستوى المنصة.

### الجدول الرئيسي
- المتجر
- الخطة
- الحالة
- تاريخ البداية
- نهاية الفترة الحالية
- trial end
- renewal state
- payment state
- آخر تحديث

### العمليات
- ربط خطة بمتجر
- تعليق اشتراك
- استئناف اشتراك
- إلغاء اشتراك
- فحص إمكانية التخفيض
- تمديد التجربة

### الصلاحيات
- `platform.subscriptions.read`
- `platform.subscriptions.write`

### API Contracts
- `GET /platform/subscriptions`
- `GET /platform/subscriptions/:storeId`
- `POST /platform/subscriptions/:storeId/cancel`
- `POST /platform/subscriptions/:storeId/suspend`
- `POST /platform/subscriptions/:storeId/resume`
- `GET /platform/subscriptions/:storeId/can-downgrade/:planCode`

---

## 10.7 Domains & SSL

### الهدف
متابعة وربط وتشخيص الدومينات المخصصة و SSL.

### الجدول الرئيسي
- الدومين
- المتجر
- target hostname
- verification status
- cname status
- ssl status
- certificate state
- validation method
- last checked at
- issue summary

### تفاصيل الدومين
- timeline كامل
- محاولات التحقق
- أخطاء DNS
- حالة CNAME
- حالة TXT
- حالة الشهادة
- خطوات مطلوبة من التاجر

### العمليات
- إعادة الفحص
- force sync
- عرض سجلات DNS المطلوبة
- نسخ السجلات
- فتح المتجر المرتبط

### الصلاحيات
- `platform.domains.read`
- `platform.domains.write`

### API Contracts
- `GET /platform/domains`
- `GET /platform/domains/issues`
- `GET /platform/domains/:domainId`
- `POST /platform/domains/:domainId/recheck`
- `POST /platform/domains/:domainId/force-sync`

---

## 10.8 Audit Logs

### الهدف
عرض وتتبع كل الإجراءات الحساسة التي تحدث في لوحة كليم.

### الجدول الرئيسي
- المنفذ
- الإجراء
- target type
- target id
- store
- timestamp
- severity
- metadata summary

### الفلاتر
- التاريخ
- المسؤول
- المتجر
- نوع الإجراء
- المجال

### الصلاحيات
- `platform.audit.read`

### API Contracts
- `GET /platform/audit-logs`

### أمثلة على الأحداث التي يجب تسجيلها
- تغيير خطة
- تعليق متجر
- استئناف متجر
- إلغاء اشتراك
- تمديد trial
- تعديل role
- إنشاء admin
- force sync domain
- تغيير إعداد عام

---

## 10.9 Team & Roles

### الهدف
إدارة أعضاء فريق كليم وصلاحياتهم.

### صفحات فرعية
- Admins List
- Roles List
- Permission Matrix

### بيانات المسؤول
- الاسم
- البريد
- الحالة
- الدور
- آخر دخول
- تاريخ الإنشاء

### العمليات
- إنشاء مسؤول
- تعديل مسؤول
- تعطيل/تفعيل
- إسناد دور
- إنشاء دور
- تعديل صلاحيات الدور

### الصلاحيات
- `platform.admins.read`
- `platform.admins.write`
- `platform.roles.read`
- `platform.roles.write`

### API Contracts
- `GET /platform/admins`
- `POST /platform/admins`
- `PATCH /platform/admins/:adminId`
- `GET /platform/roles`
- `POST /platform/roles`
- `PATCH /platform/roles/:roleId`

---

## 10.10 Health & Incidents

### الهدف
عرض الحالة التقنية للمنصة والخدمات المرتبطة بها.

### القسم الأول: Health Summary
- API health
- DB health
- Redis health
- Queue health
- Jobs health
- Error rate summary

### القسم الثاني: Incidents
- قائمة الحوادث المفتوحة
- severity
- service
- created at
- status
- assigned owner مستقبلًا

### القسم الثالث: Queue Overview
- queue name
- backlog count
- failed jobs
- retry state

### الصلاحيات
- `platform.health.read`

### API Contracts
- `GET /platform/health/summary`
- `GET /platform/health/queues`
- `GET /platform/health/incidents`

---

## 10.11 Onboarding & Success

### الهدف
مساعدة فريق كليم في متابعة المتاجر التي لم تكتمل أو تحتاج تدخلًا لزيادة التحويل والنجاح.

### القوائم الأساسية
- متاجر لم تكمل الإعداد
- متاجر لم تضف منتجات
- متاجر بدون دومين
- متاجر قاربت نهاية trial
- متاجر دون أول طلب
- متاجر تحتاج متابعة success

### العمليات
- assign owner
- add note
- extend trial
- mark contacted
- open store 360

### الصلاحيات
- `platform.onboarding.read`
- `platform.onboarding.write`

### API Contracts
- `GET /platform/onboarding/pipeline`
- `GET /platform/onboarding/stuck-stores`

---

## 10.12 Global Settings

### الهدف
إدارة الإعدادات العامة التي تؤثر على المنصة ككل.

### الأقسام المقترحة
- إعدادات الاشتراك
- إعدادات التجربة المجانية
- فترات السماح
- سياسات التعليق
- إعدادات الدومينات
- إعدادات الإشعارات
- Feature flags

### الصلاحيات
- `platform.settings.read`
- `platform.settings.write`

### API Contracts
- `GET /platform/settings`
- `PATCH /platform/settings`

---

## 11. نموذج البيانات المقترح

### 11.1 platform_admin_users
- id
- name
- email
- password_hash
- status
- last_login_at
- created_at
- updated_at

### 11.2 platform_admin_roles
- id
- name
- code
- description
- created_at
- updated_at

### 11.3 platform_admin_permissions
- id
- key
- description

### 11.4 platform_admin_role_permissions
- role_id
- permission_id

### 11.5 platform_admin_user_roles
- user_id
- role_id

### 11.6 platform_admin_sessions
- id
- user_id
- session_token_or_jti
- ip
- user_agent
- expires_at
- created_at

### 11.7 platform_store_notes
- id
- store_id
- author_admin_id
- type
- body
- pinned
- created_at
- updated_at

### 11.8 platform_incidents
- id
- type
- severity
- service
- title
- summary
- status
- related_store_id nullable
- created_at
- resolved_at nullable

### 11.9 platform_alerts
- id
- type
- severity
- related_store_id nullable
- payload json
- status
- created_at

### 11.10 platform_settings
- id
- key
- value json
- updated_by
- updated_at

---

## 12. صلاحيات النظام المقترحة

### Dashboard
- `platform.dashboard.read`

### Stores
- `platform.stores.read`
- `platform.stores.write`
- `platform.stores.suspend`
- `platform.stores.resume`

### Notes
- `platform.notes.read`
- `platform.notes.write`
- `platform.notes.delete`

### Plans
- `platform.plans.read`
- `platform.plans.write`

### Subscriptions
- `platform.subscriptions.read`
- `platform.subscriptions.write`

### Domains
- `platform.domains.read`
- `platform.domains.write`

### Audit
- `platform.audit.read`

### Health
- `platform.health.read`

### Onboarding
- `platform.onboarding.read`
- `platform.onboarding.write`

### Team & Roles
- `platform.admins.read`
- `platform.admins.write`
- `platform.roles.read`
- `platform.roles.write`

### Settings
- `platform.settings.read`
- `platform.settings.write`

---

## 13. حالات الاستخدام الأساسية

### 13.1 تعليق متجر
1. يفتح المسؤول صفحة المتجر
2. يضغط تعليق متجر
3. يختار السبب
4. يضيف ملاحظة اختيارية
5. يؤكد الإجراء
6. يسجل النظام Audit Log
7. تتحدث حالة المتجر والاشتراك

### 13.2 تمديد Trial
1. يفتح المسؤول المتجر أو صفحة onboarding
2. يختار تمديد trial
3. يحدد عدد الأيام
4. يسجل السبب
5. يتم الحفظ وتسجيل audit

### 13.3 متابعة مشكلة دومين
1. تظهر المشكلة في domains/issues
2. يفتح المسؤول تفاصيل الدومين
3. يراجع مرحلة الفشل
4. يعيد الفحص أو force sync
5. يضيف note إن لزم

### 13.4 تغيير خطة متجر
1. يفتح المسؤول صفحة المتجر
2. يعرض الخطة الحالية
3. يختار خطة جديدة
4. يتم فحص القيود إن كانت downgrade
5. يؤكد التنفيذ
6. يتم تحديث السجلات والاشتراك وAudit

---

## 14. حالات الخطأ والـ Empty States

### أمثلة مطلوبة
- لا توجد متاجر مطابقة للفلاتر
- لا توجد اشتراكات متعثرة
- لا توجد مشاكل دومينات
- لا توجد incidents مفتوحة
- لا توجد notes بعد
- فشل تحميل البيانات
- صلاحية غير كافية
- الجلسة منتهية

يجب أن تكون كل صفحة تحتوي على:
- Loading state
- Error state
- Empty state
- Retry action

---

## 15. معايير القبول العامة

### لكل شاشة
- مرتبطة بصلاحيات صحيحة
- مرتبطة بـ API حقيقي
- تحتوي loading/error/empty states
- قابلة للبحث أو الفلترة إذا كانت قائمة
- تسجل audit عند الإجراءات الحساسة
- تستخدم تصميمًا موحدًا مع بقية لوحة كليم

### لكل API حساس
- Authorization صحيح
- Validation صحيح
- Audit صحيح
- رسائل خطأ واضحة
- Pagination/filtering حيث يلزم

---

## 16. ترتيب التنفيذ المقترح

## المرحلة 1: Platform Foundation
- إعداد routing منفصل للمنصة
- إنشاء PlatformShell
- إنشاء login حقيقي
- إنشاء admin users/roles/permissions
- إنشاء route guards و permission gates

## المرحلة 2: Core Operations
- Dashboard
- Stores list
- Store 360
- Plans
- Subscriptions
- Domains & SSL

## المرحلة 3: Governance
- Team & Roles
- Audit Logs
- Global Settings

## المرحلة 4: Operational Visibility
- Health Summary
- Incidents
- Queue Overview

## المرحلة 5: Merchant Success
- Onboarding pipeline
- Stuck stores
- Internal notes

## المرحلة 6: تحسينات لاحقة
- Platform Analytics
- Automation Center
- Risk & Compliance
- Support Center

---

## 17. Backlog تنفيذي مختصر

### Epic 1: Auth & Access
- Platform login page
- Admin user entity
- Role entity
- Permission matrix
- Session handling

### Epic 2: Shell & Navigation
- Sidebar
- Topbar
- Protected routes
- Page layout

### Epic 3: Dashboard
- Summary APIs
- KPI widgets
- alerts feed
- recent activity

### Epic 4: Stores
- list page
- details page
- suspend/resume flows
- notes tab

### Epic 5: Plans & Subscriptions
- plans CRUD
- subscriptions list
- assign/change plan flows

### Epic 6: Domains
- domain list
- domain details
- recheck/sync actions

### Epic 7: Governance
- admins list
- roles list
- audit logs
- settings page

### Epic 8: Health & Success
- health page
- onboarding page
- incidents list

---

## 18. المخاطر التنفيذية

### المخاطر
- تضخم نطاق المشروع مبكرًا
- خلط صلاحيات التاجر مع صلاحيات المنصة
- بناء واجهات قبل تثبيت auth/RBAC
- ضعف audit في العمليات الحساسة
- بناء health logic خارج اللوحة فقط

### التخفيف
- الالتزام بالمراحل التنفيذية
- فصل واضح للبنية
- عدم تخطي مرحلة foundation
- تعريف permissions من البداية
- توحيد العقود البرمجية

---

## 19. مؤشرات النجاح

بعد إطلاق النسخة الأولى، يعتبر المشروع ناجحًا إذا أصبح فريق كليم قادرًا على:

- إدارة المتاجر والخطط والاشتراكات من اللوحة
- تعليق واستئناف المتاجر بشكل مضبوط وآمن
- تشخيص مشاكل الدومينات دون الرجوع اليدوي المباشر للسجلات فقط
- تتبع كل إجراء إداري عبر Audit Logs
- مراقبة الصحة العامة للمنصة من داخل اللوحة
- متابعة المتاجر غير المكتملة وتحسين التفعيل

---

## 20. الخلاصة

هذه الوثيقة تمثل خطة PRD تنفيذية مباشرة لتحويل لوحة كليم الداخلية إلى منصة تشغيل وإدارة احترافية. وهي تستفيد من الأساس القوي الموجود حاليًا في المشروع، لكنها تنظّم العمل المطلوب على مستوى المنتج، الواجهات، الـ APIs، الصلاحيات، والبيانات، بحيث تصبح كليم قابلة للإدارة الفعلية كشركة SaaS تنمو بثبات.


---

## 21. تحديث التنفيذ - ما تم في هذه المهمة (MVP Foundation + Core Ops)

تم تنفيذ العناصر التالية فعليًا داخل الكود:

- إنشاء بنية Platform Admin Auth مستقلة:
  - `POST /platform/auth/login`
  - `POST /platform/auth/refresh`
  - `POST /platform/auth/logout`
  - `GET /platform/auth/me`
- إضافة حراسات Platform مستقلة:
  - `PlatformAccessTokenGuard`
  - `PlatformPermissionsGuard`
- نقل حماية مسارات `/platform/**` من `x-platform-admin-secret` إلى Bearer token + RBAC.
- إنشاء foundation لقاعدة البيانات عبر migration جديد:
  - `platform_admin_users`
  - `platform_admin_roles`
  - `platform_admin_permissions`
  - `platform_admin_role_permissions`
  - `platform_admin_user_roles`
  - `platform_admin_sessions`
- إضافة seed للصلاحيات والأدوار الأساسية في المنصة.
- إضافة سكربت تأسيس أول Super Admin:
  - `npm run platform:seed-admin`
- تنفيذ واجهات تشغيل MVP في `/platform`:
  - Dashboard: `summary`, `alerts`, `activity`, `growth`
  - Stores: list + details + usage + activity + domains + subscription
  - Plans: CRUD الحالي + `archive` + `duplicate`
  - Subscriptions: القراءة والإجراءات الأساسية
  - Domains: list + issues + details + recheck + force-sync
- ربط الإجراءات الحساسة بسجلات التدقيق Audit بأكشنات `platform.*`.
- تحديث واجهة `apps/admin` لتجربة Platform مستقلة:
  - Login صفحة مستقلة
  - Session storage مستقل
  - API client مستقل مع refresh flow
  - Shell مستقل + صفحات MVP الأساسية
  - حماية الوصول لمسار `/platform` بجلسة المنصة.

## 22. المتبقي للمهمة التالية (Next Iteration Scope)

العناصر التالية لم تُغلق بالكامل بعد وتُنقل للمهمة القادمة:

- Store 360 الكامل متعدد التبويبات (الصيغة التشغيلية النهائية).
- Onboarding & Success pipeline الكامل + notes/worklist.
- Health & Incidents Center المتكامل داخل Platform.
- Team & Roles UI متكامل (إدارة admins/roles/permission matrix من الواجهة).
- Global Settings UI + APIs الكاملة.
- Platform Analytics المتقدمة (MRR/Churn/Cohorts/Funnel).
- تحسينات UX تشغيلية إضافية:
  - Bulk actions
  - Export workflows
  - Keyboard shortcuts
- Hardening أمني متقدم:
  - MFA
  - سياسات IP/Device
  - Step-up verification للإجراءات الحساسة.

> ملاحظة: تم الانتهاء من MVP قابل للتشغيل الداخلي، بينما البنود أعلاه تمثل مرحلة التوسعة والتشديد التالية.
