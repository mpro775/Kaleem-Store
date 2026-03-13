# دليل رفع وتشغيل الباك إند على VPS (عربي)

هذا الدليل يشرح نشر وتشغيل خدمات Kaleem Store على VPS بشكل مؤقت وعملي باستخدام Docker.

## ما الذي سيتم تشغيله؟

- API
- Worker Outbox
- Worker Notifications
- PostgreSQL
- Redis
- RabbitMQ
- Nginx Proxy Manager (لإدارة الشهادات والواجهات)
- التخزين الخارجي: Cloudflare R2

## المتطلبات

- سيرفر Ubuntu 22.04
- صلاحية SSH مع sudo
- Docker + Docker Compose Plugin
- الدومينات الفرعية (تم تجهيزها):
  - `api-temp.kaleemstores.com`
  - `mq-temp.kaleemstores.com`
  - `npm-temp.kaleemstores.com`

## 1) تجهيز السيرفر

نفذ الأوامر التالية على VPS:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git ufw
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu jammy stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

بعدها اخرج من SSH وادخل مرة ثانية.

ثم فعّل الجدار الناري:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 81
sudo ufw --force enable
```

## 2) سحب المشروع

```bash
git clone <REPO_URL> /opt/kaleem-store
cd /opt/kaleem-store
```

> ملاحظة: الملفات الجاهزة للنشر موجودة مسبقًا في المشروع:
> `Dockerfile.api` و `docker-compose.prod.yml` و `.env.prod.example`

## 3) إعداد متغيرات الإنتاج

انسخ ملف المثال:

```bash
cp .env.prod.example .env.prod
```

ثم عدّل القيم داخل `.env.prod`:

- كلمات المرور القوية (DB / RabbitMQ)
- الأسرار:
  - `JWT_ACCESS_SECRET`
  - `PLATFORM_ADMIN_SECRET`
  - `WEBHOOK_SECRET`
- إعدادات Cloudflare R2:
  - `S3_ENDPOINT`
  - `S3_BUCKET`
  - `S3_ACCESS_KEY`
  - `S3_SECRET_KEY`
  - `S3_PUBLIC_BASE_URL`

## 4) تشغيل الخدمات

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

تحقق من حالة الحاويات:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

## 5) تنفيذ الـ Migrations

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm --workdir /app api node scripts/migrate.mjs up
```

اختياري (بيانات تجريبية):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm --workdir /app api node scripts/seed.mjs
```

## 6) إعداد Nginx Proxy Manager

افتح:

- `http://npm-temp.kaleemstores.com:81`

بيانات الدخول الافتراضية:

- Email: `admin@example.com`
- Password: `changeme`

غير بيانات الدخول مباشرة.

ثم أنشئ Proxy Hosts:

1. `api-temp.kaleemstores.com` -> Forward to `api:3000`
2. `mq-temp.kaleemstores.com` -> Forward to `rabbitmq:15672`

وفعّل SSL (Let's Encrypt) مع `Force SSL` لكل واحد.

## 7) التحقق النهائي

- `https://api-temp.kaleemstores.com/health/live`
- `https://api-temp.kaleemstores.com/health/ready`
- `https://api-temp.kaleemstores.com/docs`
- `https://mq-temp.kaleemstores.com`

ولفحص السجلات:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs api --tail=100
docker compose -f docker-compose.prod.yml --env-file .env.prod logs worker-outbox --tail=100
docker compose -f docker-compose.prod.yml --env-file .env.prod logs worker-notifications --tail=100
```

## 8) أوامر مفيدة بعد الإطلاق

إعادة تشغيل:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod restart
```

إيقاف وتشغيل:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

تحديث كود جديد:

```bash
cd /opt/kaleem-store
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm --workdir /app api node scripts/migrate.mjs up
```

## 9) ملاحظات أمان مهمة (حتى لو مؤقت)

- لا تترك لوحة `npm-temp` وواجهة `mq-temp` مفتوحة بدون حماية مدة طويلة.
- فعّل Access List أو Basic Auth من Nginx Proxy Manager.
- يفضل حصر الوصول على IP محدد للإدارة.
- لا ترفع ملف `.env.prod` إلى git.
