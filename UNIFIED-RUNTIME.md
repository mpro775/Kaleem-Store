# Unified Runtime

Use the standardized runtime files:

- `docker-compose.unified.prod.yml`
- `.env.unified` (copy from `.env.unified.example` and merge values from existing `.env.prod`)

Note: `pgadmin` moved to the platform stack in stage 2.

Run core stack:

```bash
docker compose -f docker-compose.unified.prod.yml --env-file .env.unified up -d --build
```

Enable optional profiles:

```bash
docker compose -f docker-compose.unified.prod.yml --env-file .env.unified --profile object-storage up -d
```
