# Backup And Restore Runbook

## Overview

This runbook covers the backup and restore procedures for Kaleem Store.

---

## 1. Backup Strategy

### Components Backed Up

| Component     | Method       | Frequency |
| ------------- | ------------ | --------- |
| PostgreSQL    | pg_dump      | Daily     |
| Redis         | RDB snapshot | Daily     |
| MinIO Storage | tar archive  | Daily     |

### Retention Policy

- Default retention: **30 days**
- Configurable via `RETENTION_DAYS` environment variable

---

## 2. Running Backups

### Manual Backup

```bash
# Full backup (all components)
./scripts/backup.sh

# Database only
./scripts/backup.sh --database-only
```

### Automated Backup (Cron)

Add to crontab:

```bash
# Daily backup at 2:00 AM
0 2 * * * /path/to/kaleem-store/scripts/backup.sh >> /var/log/kaleem-backup.log 2>&1
```

### Environment Variables

```bash
# Backup configuration
BACKUP_DIR=/backups                    # Backup storage location
RETENTION_DAYS=30                      # Days to keep backups
DB_CONTAINER=kaleem-postgres          # Docker container name
REDIS_CONTAINER=kaleem-redis          # Docker container name
MINIO_CONTAINER=kaleem-minio          # Docker container name
POSTGRES_USER=kaleem                   # Database user
POSTGRES_DB=kaleem_store               # Database name
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx  # Optional notifications
```

---

## 3. Restore Procedures

### List Available Backups

```bash
./scripts/restore.sh list
```

### Restore Database

```bash
# Restore from specific backup
./scripts/restore.sh database ./backups/kaleem_store_20240115_020000_database.sql.gz

# The script will:
# 1. Ask for confirmation
# 2. Decompress and restore the backup
# 3. Verify the restore
```

### Restore Redis

```bash
./scripts/restore.sh redis ./backups/kaleem_store_20240115_020000_redis.rdb
```

### Restore Storage

```bash
./scripts/restore.sh storage ./backups/kaleem_store_20240115_020000_storage.tar.gz
```

### Validate Restore

```bash
# Validate database
./scripts/restore.sh validate database

# Validate Redis
./scripts/restore.sh validate redis
```

---

## 4. Manual Backup Commands

### PostgreSQL

```bash
# Backup
docker exec kaleem-postgres pg_dump -U kaleem -d kaleem_store > backup.sql

# Restore
docker exec -i kaleem-postgres psql -U kaleem -d kaleem_store < backup.sql
```

### Redis

```bash
# Backup (trigger RDB save)
docker exec kaleem-redis redis-cli BGSAVE

# Copy RDB file
docker cp kaleem-redis:/data/dump.rdb ./redis_backup.rdb

# Restore
docker cp ./redis_backup.rdb kaleem-redis:/data/dump.rdb
docker restart kaleem-redis
```

### MinIO

```bash
# Backup
docker exec kaleem-minio tar czf /tmp/backup.tar.gz /data
docker cp kaleem-minio:/tmp/backup.tar.gz ./minio_backup.tar.gz

# Restore
docker cp ./minio_backup.tar.gz kaleem-minio:/tmp/backup.tar.gz
docker exec kaleem-minio tar xzf /tmp/backup.tar.gz -C /
```

---

## 5. Backup Verification

### Integrity Check

```bash
# Verify backup file integrity
./scripts/backup.sh --verify ./backups/kaleem_store_xxx_database.sql.gz
```

### Data Validation

After restore, verify:

```bash
# Check table count
docker exec kaleem-postgres psql -U kaleem -d kaleem_store -c "
  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
"

# Check recent orders
docker exec kaleem-postgres psql -U kaleem -d kaleem_store -c "
  SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '7 days';
"

# Check outbox events
docker exec kaleem-postgres psql -U kaleem -d kaleem_store -c "
  SELECT COUNT(*) FROM outbox_events;
"
```

---

## 6. Disaster Recovery

### Full Recovery Steps

1. **Stop services**

   ```bash
   docker compose down
   ```

2. **Start infrastructure only**

   ```bash
   docker compose up -d postgres redis minio
   ```

3. **Restore database**

   ```bash
   ./scripts/restore.sh database ./backups/latest_database.sql.gz
   ```

4. **Restore Redis**

   ```bash
   ./scripts/restore.sh redis ./backups/latest_redis.rdb
   ```

5. **Restore storage**

   ```bash
   ./scripts/restore.sh storage ./backups/latest_storage.tar.gz
   ```

6. **Validate restore**

   ```bash
   ./scripts/restore.sh validate database
   ./scripts/restore.sh validate redis
   ```

7. **Start all services**

   ```bash
   docker compose up -d
   ```

8. **Verify application**
   ```bash
   curl http://localhost:3000/health/ready
   ```

---

## 7. Monthly Drill Checklist

- [ ] Run backup verification
- [ ] Test restore on staging environment
- [ ] Validate data integrity after restore
- [ ] Document any issues or delays
- [ ] Update runbook if procedures changed
- [ ] Verify notification channels (Slack, email)
