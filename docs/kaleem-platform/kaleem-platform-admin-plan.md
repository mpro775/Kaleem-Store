# خطة تنفيذ لوحة كليم الداخلية باحترافية عالية

## مقدمة

هذه الوثيقة تضع تصورًا احترافيًا كاملًا لتنفيذ **لوحة كليم الداخلية** الخاصة بفريق كليم نفسه، وليس لوحة التاجر. وهي مبنية على فهم السورس الحالي للمشروع، حيث اتضح أن كليم يمتلك بالفعل بنية قوية للمتاجر، وإدارة التاجر، والـ SaaS، لكن ما يزال يحتاج إلى **لوحة تشغيل داخلية حقيقية** تمكّن فريق كليم من إدارة المنصة كاملة بكفاءة واحترافية.

الهدف هنا ليس بناء صفحة أدمن تقليدية، بل بناء **مركز تشغيل وتحكم وحوكمة ونمو** للمنصة، بحيث يخدم الشركة على المدى الطويل مع التوسع في عدد المتاجر والاشتراكات والعمليات التشغيلية.

---

## الهدف الاستراتيجي من لوحة كليم

لوحة كليم الداخلية يجب أن تكون **Operational Control Center** للمنصة كاملة، وتحقق الأهداف التالية:

- تمكين فريق كليم من إدارة جميع المتاجر من مكان واحد.
- تقليل التدخل اليدوي في الاشتراكات، التفعيل، التعليق، الدومينات، والمتابعة.
- توفير رؤية تشغيلية ومالية وتقنية موحدة.
- دعم الحوكمة الداخلية والصلاحيات وسجلات التدقيق.
- تسهيل توسع كليم إلى عدد أكبر من المتاجر دون فوضى تشغيلية.
- تحويل كليم من منتج يمكن تشغيله إلى شركة يمكن إدارتها بثقة واحترافية.

---

## النتيجة النهائية المطلوبة

عند اكتمال تنفيذ لوحة كليم الداخلية، يجب أن يكون فريق كليم قادرًا على:

- إنشاء وإدارة الخطط والباقات.
- متابعة دورة حياة كل متجر من التسجيل حتى الإلغاء.
- تعليق أو إعادة تفعيل أو ترقية أو تخفيض المتاجر.
- مراقبة الاشتراكات والمدفوعات والتعثرات.
- متابعة الدومينات وSSL والمشاكل المرتبطة بها.
- رؤية حالة المنصة من الناحية التقنية والتشغيلية.
- إدارة فريق كليم وصلاحياته.
- مراجعة سجل كامل لكل إجراء إداري.
- إدارة ملاحظات داخلية وعمليات المتابعة.
- مراقبة النمو، التفعيل، الاحتفاظ، والتسرب.
- تشغيل المنصة من مكان واحد بطريقة واضحة ومنظمة.

---

## المبادئ المعمارية الأساسية

### 1. الفصل الكامل بين عوالم المشروع
يجب الفصل بوضوح داخل الواجهة الإدارية بين:

- الموقع أو الصفحات التسويقية.
- لوحة التاجر.
- لوحة كليم الداخلية.

ولا ينبغي أن تبقى لوحة كليم مجرد مسار بسيط داخل نفس منطق التوجيه الحالي، بل يجب أن تكون عالمًا مستقلًا تنظيميًا ووظيفيًا.

### 2. لوحة كليم يجب أن تكون Shell مستقل
يجب أن تمتلك لوحة كليم:

- Layout مستقل.
- Sidebar مستقل.
- Topbar مستقل.
- Auth مستقل.
- Permissions مستقلة.
- API layer مستقلة.

### 3. كل شيء قائم على الصلاحيات
لا يجب أن تعتمد اللوحة على مفهوم “أدمن واحد يفعل كل شيء”. بل يجب أن تكون مبنية على **RBAC** واضح ودقيق.

### 4. كل إجراء حساس يجب أن يسجل في Audit Log
خصوصًا:

- تغيير خطة متجر.
- تعليق متجر.
- إعادة تفعيل متجر.
- تمديد تجربة مجانية.
- إلغاء أو استئناف اشتراك.
- تعديل دومين أو إعداد حساس.
- تعديل صلاحيات فريق كليم.
- أي إجراء مالي أو تقني حساس.

### 5. اللوحة يجب أن تخدم العمليات لا الصفحات فقط
الهدف ليس بناء جداول كثيرة، بل بناء **Workflows تشغيلية** تقلل الفوضى والاعتماد على التواصل اليدوي بين أعضاء الفريق.

---

## التقييم الواقعي الحالي للمشروع

### الموجود فعليًا ويمكن البناء عليه
من خلال السورس الحالي، المشروع يحتوي على أساس قوي جدًا يمكن البناء عليه مباشرة:

- باك إند منظم يحتوي على وحدات كثيرة مرتبطة بالمتاجر، الطلبات، الدفع، الدومينات، الثيمات، التحليلات وغيرها.
- وجود `SaasModule` و `PlatformAdminController` و `SaasService` و `SaasRepository`.
- وجود `AuditModule` و `ObservabilityModule`.
- وجود لوحة تاجر غنية في الفرونت يمكن إعادة استخدام أجزاء كثيرة منها.
- وجود نواة لإدارة الخطط والاشتراكات وبعض عمليات المنصة.

### الفجوات الحالية
لكن ما يزال ينقص المشروع لكي يصبح عنده Platform Admin حقيقي:

- لا يوجد Auth داخلي حقيقي لفريق كليم.
- لا يوجد RBAC خاص بفريق المنصة.
- لا توجد صفحات تشغيلية حقيقية للوحة كليم.
- لا يوجد Dashboard تشغيلي مركزي.
- لا توجد صفحة Store 360 من منظور كليم.
- لا يوجد مركز Notes داخلي أو متابعة تشغيلية.
- لا يوجد Health Center داخل اللوحة.
- لا يوجد Platform Analytics متكامل.

---

## الهيكل الوظيفي الكامل للوحة كليم

## 1. Dashboard
هذه أهم شاشة في اللوحة كلها، ويجب أن تكون مركز قيادة يومي للفريق.

### يجب أن تعرض
- إجمالي عدد المتاجر.
- المتاجر النشطة.
- المتاجر التجريبية.
- المتاجر المعلقة.
- المتاجر الملغاة.
- الاشتراكات النشطة.
- الاشتراكات المتعثرة.
- الاشتراكات التي تنتهي قريبًا.
- عدد الدومينات المرتبطة.
- عدد الدومينات التي فيها مشاكل.
- عدد المتاجر الجديدة هذا الأسبوع.
- عدد المتاجر التي لم تكمل الإعداد.
- إجمالي الطلبات على مستوى المنصة.
- إجمالي المبيعات على مستوى المنصة.
- تنبيهات حرجة.
- أحداث تحتاج تدخل.
- أفضل المتاجر نموًا.
- نشاط الفريق الإداري مؤخرًا.

### مكونات الشاشة
- KPI Cards.
- Alerts Feed.
- Recent Activity.
- Growth Snapshots.
- Quick Actions.

---

## 2. إدارة المتاجر Stores
هذه الصفحة هي العمود الفقري للتشغيل اليومي.

### الأعمدة الأساسية
- اسم المتجر.
- الكود أو الـ Slug.
- اسم المالك.
- بريد المالك.
- رقم الهاتف.
- الحالة.
- الخطة الحالية.
- حالة الاشتراك.
- عدد المنتجات.
- عدد الطلبات.
- آخر نشاط.
- تاريخ الإنشاء.
- حالة الدومين.
- Completion Score.

### العمليات
- فتح تفاصيل المتجر.
- تعليق المتجر.
- إعادة تفعيل المتجر.
- تغيير الخطة.
- تمديد Trial.
- فتح Notes داخلية.
- فتح صفحة الدومينات.
- نسخ رابط المتجر.
- فلترة متقدمة.
- تصدير البيانات.

---

## 3. صفحة Store 360
لكل متجر يجب وجود صفحة شاملة من منظور كليم.

### الأقسام
- معلومات عامة.
- بيانات المالك.
- بيانات الاشتراك.
- الحدود والاستهلاك.
- النشاط الأخير.
- حالة التفعيل.
- حالة الدومين.
- حالة الثيم.
- حالة التكاملات.
- الملاحظات الداخلية.
- السجل الإداري.
- التنبيهات أو المخاطر.

### الإجراءات السريعة
- تعليق المتجر.
- إعادة تفعيله.
- تغيير الخطة.
- بدء أو تمديد Trial.
- إلغاء الاشتراك.
- استئناف الاشتراك.
- الدخول كدعم بصلاحية مناسبة.
- إرسال تذكير.
- تعيين مسؤول متابعة.
- إضافة Note داخلية.
- ربط أو مراجعة الدومين.

---

## 4. إدارة الخطط Plans
هذه من أهم أقسام اللوحة لأن كليم SaaS.

### بيانات الخطة
- الاسم.
- Code.
- الوصف.
- السعر.
- العملة.
- مدة الفوترة.
- هل هي مجانية أو تجريبية أو مدفوعة.
- هل هي مفعلة.
- Limits.
- Features.
- Flags.
- ترتيب العرض.
- الوصف التسويقي.

### الحدود التي يجب دعمها
- عدد المنتجات.
- عدد الطلبات شهريًا.
- عدد الموظفين.
- عدد الدومينات.
- التخزين.
- API Calls.
- Webhooks.
- Features Enabled.
- Advanced Analytics.
- Theme Builder Access.
- Custom Domain Availability.
- Priority Support.

### العمليات
- إنشاء خطة.
- تعديل خطة.
- تعطيل خطة.
- أرشفة خطة.
- نسخ خطة.
- مقارنة الخطط.
- ربط الخطة بمتجر.
- اختبار أثر الـ Downgrade.

---

## 5. إدارة الاشتراكات Subscriptions
هذه شاشة مستقلة عن الخطط نفسها.

### ما يجب عرضه
- المتجر.
- الخطة.
- حالة الاشتراك.
- بداية الاشتراك.
- نهاية الفترة.
- نهاية التجربة.
- Renewal State.
- Trial State.
- Payment State.
- آخر تعديل.
- التعليق إن وجد.

### العمليات
- Assign Plan.
- Suspend Subscription.
- Resume Subscription.
- Cancel Subscription.
- Move to Past Due.
- Restart Trial.
- Force Renewal.
- Mark Paid يدويًا إذا لزم.
- فحص إمكانية Downgrade.

---

## 6. إدارة الدومينات و SSL
هذا قسم حساس جدًا ويجب أن يكون واضحًا جدًا للفريق.

### الجدول الأساسي
- Domain.
- Store.
- Hostname / Target.
- Verification Status.
- CNAME Status.
- SSL Status.
- Certificate Issuance Status.
- Validation Method.
- Last Checked At.
- Cloudflare Status.
- Issue Summary.

### العمليات
- إعادة فحص الدومين.
- إعادة فحص DNS.
- Force Sync.
- عرض سجلات DNS المطلوبة.
- نسخ سجلات TXT / CNAME.
- عرض سجل المحاولات.
- الربط بصفحة المتجر.
- تصعيد للدعم.

### شاشة Domain Details
يجب أن تعرض:
- Timeline كامل.
- مراحل التحقق.
- حالة كل خطوة.
- آخر أخطاء.
- ما الذي ينقص التاجر بالضبط.

---

## 7. إدارة فريق كليم Team & Roles
هذا قسم أساسي لبناء لوحة احترافية طويلة المدى.

### البيانات
- Admins.
- Roles.
- Permissions.
- Sessions.
- Last Login.
- Status.
- MFA Status مستقبلًا.

### الأدوار المقترحة
- Super Admin.
- Operations Manager.
- Merchant Success.
- Support Agent.
- Finance Admin.
- Technical Admin.
- Product Admin.
- Read Only Auditor.

### الصلاحيات المقترحة
- `stores.read`
- `stores.write`
- `stores.suspend`
- `plans.read`
- `plans.write`
- `subscriptions.read`
- `subscriptions.write`
- `domains.read`
- `domains.write`
- `audit.read`
- `health.read`
- `settings.write`
- `admins.manage`
- `impersonation.use`
- `reports.export`

---

## 8. سجل التدقيق Audit Logs
يجب أن يكون هذا القسم searchable وقابلًا للتصفية.

### ما يجب عرضه
- من نفذ الإجراء.
- نوع الإجراء.
- Target Type.
- Target ID.
- Store إن وجد.
- القيم قبل/بعد.
- Metadata.
- Timestamp.
- IP.
- Session Identifier.

### الفلاتر
- التاريخ.
- اسم المسؤول.
- نوع الحدث.
- المتجر.
- مستوى الخطورة.
- المجال المالي أو الإداري أو التقني.

---

## 9. صحة المنصة Health & Incidents
هذه الشاشة مهمة جدًا لفريق كليم التقني والتشغيلي.

### ما يجب عرضه
- API Status.
- DB Status.
- Redis Status.
- RabbitMQ / Queues.
- Scheduled Jobs.
- Failed Jobs.
- Dead Letter Queues.
- Sentry Issues Summary.
- Latency Overview.
- Error Rate.
- Availability Summary.

### أقسام إضافية
- Incidents Timeline.
- Quick Diagnostics.
- Runbook Links.
- Service Ownership.

---

## 10. مركز التفعيل والنمو Onboarding & Success
هذا القسم يركز على تحويل المتاجر المسجلة إلى متاجر نشطة وناجحة.

### ما يجب عرضه
- المتاجر التي لم تكمل Onboarding.
- المتاجر التي لم تضف منتجات.
- المتاجر التي لم تربط دومين.
- المتاجر التي لم تنشر الثيم.
- المتاجر التي قاربت نهاية Trial.
- المتاجر التي لا تملك طلبات بعد التفعيل.
- المتاجر التي تحتاج متابعة من فريق النجاح.

### العمليات
- Assign Owner.
- Extend Trial.
- Send Reminder.
- Add Note.
- Mark as Contacted.
- Move to Watchlist.

---

## 11. Internal Notes
كل متجر يجب أن يكون له Notes داخلية واضحة للفريق.

### أنواع الملاحظات
- Support.
- Sales.
- Finance.
- Risk.
- Product Feedback.
- Priority Account.

### الخصائص المطلوبة
- Mentions.
- Pinning.
- Attachments مستقبلًا.
- ربط الملاحظة بمتابعة أو Task لاحقًا.

---

## 12. Platform Analytics
هذه ليست تحليلات التاجر، بل تحليلات كليم نفسها.

### المؤشرات المطلوبة
- MRR.
- ARR.
- Churn Rate.
- Trial to Paid.
- Active Stores.
- New Stores.
- Reactivated Stores.
- Avg Orders per Active Store.
- Top Categories.
- Domain Adoption Rate.
- Theme Adoption.
- Conversion Health.
- Retention Cohorts مستقبلًا.

---

## 13. الإعدادات العامة Global Settings
هذه شاشة حوكمة عامة للمنصة.

### ما يجب أن تحتويه
- إعدادات الاشتراكات.
- فترات السماح Grace Periods.
- سياسات الإيقاف.
- سياسات الـ Trial.
- إعدادات الدومينات.
- إعدادات الإشعارات.
- Feature Flags.
- روابط الدعم.
- System Defaults.

---

## الهيكل الجانبي النهائي للوحة

الترتيب المقترح للـ Sidebar:

- Dashboard
- Stores
- Onboarding & Success
- Plans
- Subscriptions
- Domains & SSL
- Health & Incidents
- Platform Analytics
- Audit Logs
- Team & Roles
- Global Settings

ومستقبلًا يمكن إضافة:

- Support Center
- Risk & Compliance
- Financial Ops
- Automation Center

---

## المعمارية التقنية المقترحة

## الفرونت `apps/admin`
يُفضل إنشاء بنية واضحة خاصة بالمنصة:

```text
src/features/platform/
  api/
  components/
  layouts/
  pages/dashboard
  pages/stores
  pages/store-details
  pages/plans
  pages/subscriptions
  pages/domains
  pages/audit
  pages/health
  pages/onboarding
  pages/team
  pages/settings
  types/
  hooks/
  guards/
```

### مكونات أساسية مقترحة
- `PlatformShell`
- `PlatformSidebar`
- `PlatformTopbar`
- `PermissionGate`
- `PageHeader`
- `DataTable`
- `StateBlocks`
- `AlertFeed`

## الباك إند `apps/api`
يُفضل فصل أو تنظيم وحدات المنصة بالشكل التالي:

- `platform-admin-auth`
- `platform-admin-users`
- `platform-dashboard`
- `platform-stores`
- `platform-subscriptions`
- `platform-domains`
- `platform-health`
- `platform-audit`
- `platform-onboarding`
- `platform-settings`

مع إمكانية إبقاء بعض المنطق داخل `saas` لكن بطريقة منظمة وواضحة.

---

## نموذج البيانات المطلوب إضافته

### `platform_admin_users`
- id
- name
- email
- password_hash
- status
- last_login_at
- created_at
- updated_at

### `platform_admin_roles`
- id
- name
- code
- description

### `platform_admin_permissions`
- id
- key
- description

### `platform_admin_role_permissions`
- role_id
- permission_id

### `platform_admin_user_roles`
- user_id
- role_id

### `platform_admin_sessions`
- id
- user_id
- token/session
- ip
- user_agent
- created_at
- expires_at

### `platform_store_notes`
- id
- store_id
- author_admin_id
- type
- body
- pinned
- created_at

### `platform_incidents`
- id
- type
- severity
- service
- title
- summary
- status
- created_at
- resolved_at

### `platform_alerts`
- id
- type
- severity
- related_store_id
- payload
- status
- created_at

### `platform_tasks`
إذا أردتم طبقة تشغيلية أدق لاحقًا:
- id
- type
- status
- assigned_to
- related_store_id
- due_at
- metadata

---

## نظام الصلاحيات والأمن

### الوضع الحالي
الوضع الحالي يعتمد على Secret في الهيدر، وهذا مقبول كبداية تقنية داخلية، لكنه غير مناسب كلوجين فعلي لفريق كليم.

### المطلوب
- Login حقيقي.
- Password Hashing.
- Session أو JWT Strategy مناسبة.
- MFA لاحقًا.
- Backend Permission Enforcement.
- Frontend Permission Guards.
- Audit لكل الأعمال الحساسة.
- Rate Limiting لمسارات الإدارة.
- IP / Device Visibility.
- Secure Impersonation Flow إذا تم اعتماده.

### ما يجب منعه
- أي وصول لمسارات المنصة بدون Auth.
- أي إجراء خطير بدون Permission واضحة.
- أي تعديل إداري بدون Audit Log.
- أي Export حساس بدون صلاحية.

---

## العمليات التشغيلية الكاملة التي يجب أن تدعمها اللوحة

## 1. تسجيل متجر جديد
- يظهر المتجر مباشرة في Pipeline.
- تُحدد حالته الحالية.
- يظهر هل أكمل الإعداد أم لا.
- يظهر هل بدأ Trial أم لا.
- يظهر إن كان يحتاج متابعة.

## 2. متجر لم يكمل الإعداد
- يظهر في شاشة Onboarding.
- يوضح ما الذي ينقصه.
- يمكن تمديد Trial.
- يمكن إرسال Reminder.
- يمكن وضع Note.
- يمكن إسناده إلى مسؤول Success.

## 3. ترقية أو تخفيض خطة
- عرض الخطة الحالية.
- عرض الخطة الجديدة.
- عرض الفروقات.
- فحص التوافق.
- إظهار تعارضات Downgrade.
- تسجيل القرار.
- تنفيذ التغيير.
- تحديث Audit.

## 4. تعليق متجر
- اختيار السبب.
- تحديد نوع التعليق.
- تحديد أثر التعليق على الدخول أو العرض أو الطلبات.
- حفظ الملاحظة.
- تسجيل Audit.
- ظهور التنبيه في صفحة المتجر.

## 5. إعادة تفعيل متجر
- إزالة التعليق.
- تحديث الاشتراك.
- التحقق من الحالة.
- تسجيل Audit.
- تحديث آخر إجراء.

## 6. متابعة دومين
- رصد المشكلة.
- فتح تفاصيل الدومين.
- معرفة نقطة الفشل.
- إعادة الفحص.
- إرسال توجيهات للتاجر أو الدعم.
- إغلاق المشكلة بعد الحل.

## 7. مراجعة تعثر اشتراك
- يظهر الاشتراك كـ Past Due.
- يظهر عدد الأيام.
- يربط بالمتجر.
- يسمح بتمديد Grace Period.
- يسمح بالتعليق.
- يسمح بإعادة التفعيل.

## 8. متابعة متجر مهم
- إضافة Note داخلية.
- تثبيت Note.
- تعيين Owner.
- إضافة Tags مستقبلًا.
- إضافته إلى Watchlist.

## 9. مراجعة حادثة تقنية
- ظهور Incident.
- تحديد Severity.
- ربطها بخدمة أو متجر.
- تعيين مسؤول.
- وضع تحديثات.
- إغلاق الحادثة.

---

## برنامج الـ APIs المطلوب

### Dashboard
- `GET /platform/dashboard/summary`
- `GET /platform/dashboard/alerts`
- `GET /platform/dashboard/activity`
- `GET /platform/dashboard/growth`

### Stores
- `GET /platform/stores`
- `GET /platform/stores/:storeId`
- `GET /platform/stores/:storeId/usage`
- `GET /platform/stores/:storeId/activity`
- `GET /platform/stores/:storeId/domains`
- `GET /platform/stores/:storeId/subscription`
- `POST /platform/stores/:storeId/suspend`
- `POST /platform/stores/:storeId/resume`
- `POST /platform/stores/:storeId/assign-plan`
- `POST /platform/stores/:storeId/extend-trial`

### Notes
- `GET /platform/stores/:storeId/notes`
- `POST /platform/stores/:storeId/notes`
- `PATCH /platform/notes/:noteId`
- `DELETE /platform/notes/:noteId`

### Plans
- `GET /platform/plans`
- `POST /platform/plans`
- `PATCH /platform/plans/:planId`
- `POST /platform/plans/:planId/archive`
- `POST /platform/plans/:planId/duplicate`

### Subscriptions
- `GET /platform/subscriptions`
- `GET /platform/subscriptions/:storeId`
- `POST /platform/subscriptions/:storeId/cancel`
- `POST /platform/subscriptions/:storeId/suspend`
- `POST /platform/subscriptions/:storeId/resume`
- `GET /platform/subscriptions/:storeId/can-downgrade/:planCode`

### Domains
- `GET /platform/domains`
- `GET /platform/domains/issues`
- `GET /platform/domains/:domainId`
- `POST /platform/domains/:domainId/recheck`
- `POST /platform/domains/:domainId/force-sync`

### Team & Roles
- `POST /platform/auth/login`
- `POST /platform/auth/logout`
- `GET /platform/admins`
- `POST /platform/admins`
- `PATCH /platform/admins/:adminId`
- `GET /platform/roles`
- `POST /platform/roles`
- `PATCH /platform/roles/:roleId`

### Audit
- `GET /platform/audit-logs`

### Health
- `GET /platform/health/summary`
- `GET /platform/health/queues`
- `GET /platform/health/incidents`

### Onboarding
- `GET /platform/onboarding/pipeline`
- `GET /platform/onboarding/stuck-stores`

---

## تجربة المستخدم داخل اللوحة

الاحترافية هنا لا تعني الشكل فقط، بل الوضوح وسرعة الوصول ودقة المعلومة.

### المعايير المطلوبة
- Sidebar واضح وثابت.
- Search عام.
- Tables قوية مع Filters.
- إجراءات Contextual.
- Empty States ممتازة.
- Audit Visibility.
- Status Chips واضحة.
- Alert Banners.
- Quick Actions Drawer.
- Tabs منظمة داخل Store 360.
- دعم استخدام لوحة المفاتيح قدر الإمكان.
- تصميم Desktop First مع استجابة جيدة.

### Design System
بما أن المشروع يستخدم MUI، فيفضّل الاستمرار عليه مع إنشاء Layer موحدة خاصة بالمنصة مثل:
- Cards
- Stats Blocks
- Tables
- Severity Chips
- Status Badges
- Platform Layout Tokens

---

## البرامج التنفيذية الرئيسية

## البرنامج A: Platform Foundation
يشمل:
- فصل Routing.
- إنشاء Platform Shell.
- إنشاء Auth حقيقي.
- إنشاء RBAC.
- إنشاء Permission Guards.
- إنشاء Admin Session Management.
- إنشاء Audit Hooks.

### المخرج النهائي
تصبح اللوحة قابلة للدخول والإدارة بأمان واستقلالية.

## البرنامج B: Core Platform Operations
يشمل:
- Dashboard.
- Stores List.
- Store 360.
- Plans.
- Subscriptions.
- Domains.

### المخرج النهائي
يصبح فريق كليم قادرًا على إدارة المنصة تشغيلًا فعليًا يوميًا.

## البرنامج C: Governance & Control
يشمل:
- Team & Roles.
- Audit Logs.
- Global Settings.
- Sensitive Actions Flows.
- Impersonation Policy إن اعتمدت.

### المخرج النهائي
تصبح المنصة قابلة للإدارة المؤسسية والحوكمة الداخلية.

## البرنامج D: Operational Visibility
يشمل:
- Health Center.
- Incidents.
- Alerts Feed.
- Queue Overview.
- Service Health.

### المخرج النهائي
تصبح الحالة التقنية للمنصة واضحة من داخل اللوحة نفسها.

## البرنامج E: Merchant Success
يشمل:
- Onboarding Pipeline.
- Stuck Stores.
- Notes.
- Follow-up Actions.
- Watchlists.

### المخرج النهائي
لا تكتفي كليم بتسجيل المتاجر، بل تدير نجاحها فعليًا.

## البرنامج F: Growth Intelligence
يشمل:
- Platform Analytics.
- Revenue Snapshots.
- Trial Conversion.
- Churn Metrics.
- Domain Adoption.
- Cohort Views لاحقًا.

### المخرج النهائي
تتحول القرارات التشغيلية إلى قرارات مبنية على البيانات.

---

## ترتيب الـ Backlog التنفيذي

### Epic 1: Platform Identity & Access
- Platform Login.
- Admin User Model.
- Roles & Permissions.
- Route Guards.
- Session Management.
- Secure Logout.
- Password Reset Flow.

### Epic 2: Platform Layout & Navigation
- Sidebar.
- Topbar.
- Page Container.
- Breadcrumbs.
- Search Shell.
- Settings Area.
- Protected Routes.

### Epic 3: Dashboard
- Summary API.
- KPI Widgets.
- Alerts Section.
- Recent Activity.
- Growth Cards.

### Epic 4: Stores Management
- Stores List API Integration.
- Filtering.
- Store Details Page.
- Suspension Flow.
- Quick Actions.

### Epic 5: Plans & Subscriptions
- Plans CRUD UI.
- Subscriptions UI.
- Assign Plan Flow.
- Downgrade Checks.
- Trial Extension.

### Epic 6: Domains & SSL
- Domains List.
- Domain Details.
- Domain Recheck.
- Issue States.
- DNS Guidance UI.

### Epic 7: Notes & Success
- Internal Notes.
- Onboarding Pipeline.
- Follow-up Actions.
- Owner Assignment.

### Epic 8: Audit & Governance
- Audit Logs Page.
- Permissions Matrix.
- Admin Management.
- Action Confirmations.

### Epic 9: Health & Incidents
- Health Summary.
- Queue Visibility.
- Incidents Feed.
- Links to Runbooks.

### Epic 10: Platform Analytics
- MRR / Churn / Trial Metrics.
- Top Stores.
- Activation Funnel.
- Usage Analytics.

---

## معايير الجودة والجاهزية

أي جزء لا يُعتبر منتهيًا حتى يحقق ما يلي:

- Backend Authorization كامل.
- Frontend Permission Enforcement.
- Audit Logging.
- Empty / Loading / Error States.
- Responsive Behavior مقبول.
- Search و Filtering.
- Pagination.
- Confirmation Flows.
- Success / Failure Feedback.
- Test Coverage للمنطق الحساس.
- Documentation مختصرة وواضحة للمطورين.

---

## ما يجب تأجيله حتى لا يتضخم المشروع مبكرًا

حتى مع الرغبة في الاحترافية، من الأفضل تأجيل بعض الأجزاء حتى لا تتضخم النسخة الأولى:

- Ticketing System داخلي متكامل إذا لم يكن حجم الدعم كبيرًا بعد.
- CRM متقدم جدًا.
- Billing Engine مالي معقد إذا لم تُحسم بوابات الدفع والسياسات بالكامل.
- Rule Engine ضخم للأتمتة.
- Advanced Cohort Analytics في النسخة الأولى.
- Impersonation كامل إذا لم يتم تأمينه جيدًا.
- Workflow Builder عام.

---

## أخطر الأخطاء التي يجب تجنبها

- بناء واجهات كثيرة بدون Auth وصلاحيات حقيقية.
- إبقاء لوحة كليم ضمن منطق التوجيه البسيط الحالي.
- التعامل مع لوحة كليم كأنها صفحة أدمن واحدة فقط.
- عدم بناء Store 360 من البداية.
- عدم تسجيل Audit للأعمال الحساسة.
- خلط صلاحيات التاجر مع صلاحيات فريق كليم.
- الاعتماد الكامل على أدوات خارجية مثل Grafana دون وجود رؤية تشغيلية داخل اللوحة.
- وضع كل شيء داخل `saas` بشكل غير منظم.
- عدم إنشاء Onboarding / Success Pipeline.
- بناء Dashboard تجميلي بلا قيمة تشغيلية.

---

## الخلاصة التنفيذية

الخطة الاحترافية الصحيحة لكليم هي أن تتحول اللوحة الداخلية إلى **منصة إدارة وتشغيل وحوكمة ونمو**، وليس مجرد Admin Panel عام.

والشكل النهائي الذي يجب الوصول إليه هو:

- Platform Auth + RBAC
- Platform Shell مستقل
- Dashboard تشغيلي حقيقي
- Stores + Store 360
- Plans + Subscriptions
- Domains & SSL
- Audit + Team & Roles
- Health & Incidents
- Onboarding & Success
- Platform Analytics
- Global Settings

بهذا تصبح كليم ليست مجرد منصة يمكن إطلاقها، بل شركة يمكن إدارتها بكفاءة عالية وبنية تشغيلية احترافية.
