# دليل إعداد pgAdmin على الـ VPS مع دومين فرعي

هذا الدليل يشرح طريقة تشغيل `pgAdmin` داخل Docker على نفس الـ VPS، ثم ربطه عبر دومين فرعي من خلال `Nginx Proxy Manager` بدون فتح منفذ PostgreSQL للعالم.

## لماذا هذا الإعداد هو الأفضل؟

- `pgAdmin` يعمل داخل شبكة Docker الداخلية ويصل إلى `postgres:5432` مباشرة.
- لا نفتح منفذ قاعدة البيانات `5432` خارجيًا.
- الوصول الخارجي يكون فقط عبر HTTPS من خلال `Nginx Proxy Manager`.
- يمكن لاحقًا إضافة `Access List` أو قصر الوصول على IP محدد.

## التأثير على أداء الـ VPS

- التأثير الطبيعي لـ `pgAdmin` نفسه محدود غالبًا.
- الحمل الحقيقي يأتي من الاستعلامات الثقيلة أو تصدير البيانات الكبيرة.
- على VPS صغير، توقّع استهلاك RAM إضافي بسيط إلى متوسط حسب الاستخدام.
- إذا كان الاستخدام إداريًا متقطعًا، فعادة لا يوجد تأثير ملحوظ على التطبيق.

## هل يمكن الوصول حاليًا من pgAdmin المحلي؟

نعم، لكن فقط إذا كانت قاعدة البيانات مكشوفة خارجيًا أو إذا استخدمت `SSH tunnel`.

في هذا المشروع، إعداد الإنتاج في `docker-compose.prod.yml` لا يفتح PostgreSQL خارجيًا، لذلك الربط المباشر من `pgAdmin` المحلي لن يعمل عادة إلا عبر نفق SSH.

مثال على نفق SSH من جهازك المحلي:

```bash
ssh -L 5433:127.0.0.1:5432 <USER>@<VPS_IP>
```

ثم في `pgAdmin` المحلي استخدم:

- Host: `127.0.0.1`
- Port: `5433`
- Username: قيمة `POSTGRES_USER`
- Password: قيمة `POSTGRES_PASSWORD`
- Database: قيمة `POSTGRES_DB`

## ما تم تجهيزه داخل المشروع

- إضافة خدمة `pgadmin` إلى `docker-compose.prod.yml`
- إضافة Volume دائم لبيانات `pgAdmin`
- إضافة متغيرات `PGADMIN_DEFAULT_EMAIL` و `PGADMIN_DEFAULT_PASSWORD` إلى `.env.prod.example`

## 1) تجهيز ملف البيئة

على الـ VPS، من داخل مجلد المشروع:

```bash
cp .env.prod.example .env.prod
```

ثم عدّل `.env.prod` وأضف أو راجع القيم التالية:

```env
POSTGRES_USER=kaleem
POSTGRES_PASSWORD=replace_with_strong_password
POSTGRES_DB=kaleem_store

PGADMIN_DEFAULT_EMAIL=ops@example.com
PGADMIN_DEFAULT_PASSWORD=replace_with_strong_pgadmin_password
```

مهم:

- استخدم كلمة مرور قوية جدًا لـ `pgAdmin`.
- لا ترفع `.env.prod` إلى Git.
- لا تستخدم نفس كلمة مرور `pgAdmin` الخاصة بقاعدة البيانات.

## 2) رفع المشروع أو تحديثه على الـ VPS

إذا كانت هذه أول مرة:

```bash
git clone <REPO_URL> /opt/kaleem-store
cd /opt/kaleem-store
cp .env.prod.example .env.prod
```

إذا كان المشروع موجودًا مسبقًا:

```bash
cd /opt/kaleem-store
git pull
```

## 3) بناء وتشغيل الخدمات

شغّل الخدمات:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

تحقق من أن الخدمة تعمل:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml --env-file .env.prod logs pgadmin --tail=100
```

## 4) إنشاء الدومين الفرعي وربط DNS

اختر دومين فرعي واضحًا، مثل:

- `db-admin.example.com`

ثم من مزود DNS أضف سجل:

- النوع: `A`
- الاسم: `db-admin`
- القيمة: `VPS_PUBLIC_IP`

إذا كنت تستخدم Cloudflare:

- ابدأ بوضع `DNS only` أثناء الاختبار الأول إن رغبت بتبسيط التشخيص.
- بعد نجاح الشهادة والربط، يمكنك تقرير الإبقاء عليه كذلك أو ضبطه حسب سياستك.

## 5) إعداد Nginx Proxy Manager

افتح لوحة `Nginx Proxy Manager` ثم أنشئ `Proxy Host` جديدًا بالقيم التالية:

- Domain Names: `db-admin.example.com`
- Scheme: `http`
- Forward Hostname / IP: `pgadmin`
- Forward Port: `80`
- Cache Assets: `Off`
- Block Common Exploits: `On`
- Websockets Support: `On`

ثم من تبويب SSL:

- اختر `Request a new SSL Certificate`
- فعّل `Force SSL`
- فعّل `HTTP/2 Support`
- أدخل بريدًا صالحًا لشهادة Let's Encrypt

## 6) الحماية الموصى بها

الحد الأدنى الموصى به:

- كلمة مرور قوية جدًا لـ `pgAdmin`
- تغيير بريد الدخول الافتراضي إلى بريد إداري حقيقي
- تفعيل `Access List` من `Nginx Proxy Manager`
- قصر الوصول على IP مكتبك أو VPN إن أمكن

ولا يُنصح بما يلي:

- فتح المنفذ `5432` للعامة
- ترك `pgAdmin` متاحًا دون SSL
- استخدام كلمة مرور ضعيفة أو مشتركة

## 7) تسجيل PostgreSQL داخل pgAdmin

بعد فتح `https://db-admin.example.com` وتسجيل الدخول، أضف Server جديدًا داخل `pgAdmin`:

### General

- Name: `Kaleem Production DB`

### Connection

- Host name/address: `postgres`
- Port: `5432`
- Maintenance database: `kaleem_store` أو `postgres`
- Username: قيمة `POSTGRES_USER`
- Password: قيمة `POSTGRES_PASSWORD`

لأن `pgAdmin` و `postgres` داخل نفس شبكة Docker، استخدم `postgres` كاسم المضيف، وليس IP خارجي.

## 8) أوامر مفيدة للصيانة

إعادة تشغيل `pgAdmin` فقط:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod restart pgadmin
```

مراقبة السجلات:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f pgadmin
```

إيقاف الخدمة فقط:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod stop pgadmin
```

## 9) التحقق النهائي

- افتح `https://db-admin.example.com`
- سجّل دخول `pgAdmin`
- أضف السيرفر باستخدام `postgres:5432`
- تأكد من ظهور الجداول وقابلية تنفيذ استعلام بسيط

## 10) بديل أكثر أمانًا

إذا أردت أعلى أمان وأقل حمل علني على الإنترنت، استخدم `pgAdmin` المحلي مع `SSH tunnel` بدل نشر `pgAdmin` على دومين عام.

هذا الخيار أفضل إذا كان المستخدمون الإداريون قليلين أو الوصول محصور بك أنت فقط.
