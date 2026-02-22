# Observability & Monitoring Runbook

## Overview

This runbook covers the observability stack for Kaleem Store, including logging, metrics, and error tracking.

---

## 1. Sentry Integration

### Setup

Set the following environment variables:

```bash
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_RELEASE=1.0.0
```

### Usage in Code

```typescript
import { SentryService } from './observability/sentry.service';

// In a service
constructor(private readonly sentryService: SentryService) {}

// Capture exceptions
try {
  // ... code
} catch (error) {
  this.sentryService.captureException(error, {
    storeId: 'store-123',
    requestId: 'req-456',
  });
}

// Set user context
this.sentryService.setUser({
  id: 'user-123',
  storeId: 'store-123',
  role: 'owner',
});

// Add breadcrumbs
this.sentryService.addBreadcrumb({
  category: 'api',
  message: 'Order created',
  data: { orderId: 'order-123' },
});
```

### Error Handling

- All unhandled exceptions are automatically captured
- Request context (storeId, userId) is attached when available
- Breadcrumbs help track the flow before an error

---

## 2. Prometheus Metrics

### Endpoint

Metrics are exposed at: `GET /metrics`

### Available Metrics

| Metric                                 | Type      | Description            |
| -------------------------------------- | --------- | ---------------------- |
| `kaleem_http_requests_total`           | Counter   | Total HTTP requests    |
| `kaleem_http_request_duration_seconds` | Histogram | Request duration       |
| `kaleem_errors_total`                  | Counter   | Total errors by type   |
| `kaleem_db_connections_active`         | Gauge     | Active DB connections  |
| `kaleem_queue_messages_pending`        | Gauge     | Pending queue messages |
| `kaleem_orders_created_total`          | Counter   | Orders created         |
| `kaleem_checkout_started_total`        | Counter   | Checkouts started      |
| `kaleem_checkout_completed_total`      | Counter   | Checkouts completed    |
| `kaleem_checkout_duration_seconds`     | Histogram | Checkout duration      |

### Prometheus Configuration

```yaml
scrape_configs:
  - job_name: 'kaleem-api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/metrics'
```

### Grafana Dashboard

Import the dashboard with panels for:

- Request rate (requests/second)
- Error rate (errors/second by status)
- Latency percentiles (p50, p90, p99)
- Database connections
- Queue depth

---

## 3. Health Checks

### Endpoints

| Endpoint                      | Purpose                             |
| ----------------------------- | ----------------------------------- |
| `GET /health/live`            | Liveness probe - is app running     |
| `GET /health/ready`           | Readiness probe - can serve traffic |
| `GET /health/detail`          | Detailed health with all components |
| `GET /health/component/:name` | Individual component health         |

### Component Health

Each component returns:

```json
{
  "status": "ok" | "down",
  "latency": 5,
  "message": "Optional message"
}
```

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## 4. Alerting Rules

### Critical Alerts

```yaml
# High error rate
- alert: HighErrorRate
  expr: rate(kaleem_errors_total[5m]) > 10
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: 'High error rate detected'

# Database down
- alert: DatabaseDown
  expr: kaleem_db_connections_active == 0
  for: 1m
  labels:
    severity: critical

# High latency
- alert: HighLatency
  expr: histogram_quantile(0.99, rate(kaleem_http_request_duration_seconds_bucket[5m])) > 2
  for: 5m
  labels:
    severity: warning
```

---

## 5. Log Aggregation

### Structured Logging

All logs include:

- `timestamp`: ISO 8601 format
- `level`: info, warn, error
- `requestId`: Unique request identifier
- `storeId`: Tenant context
- `message`: Log message

### Log Levels

- **ERROR**: Application errors, exceptions
- **WARN**: Deprecations, potential issues
- **INFO**: Significant events
- **DEBUG**: Detailed debugging (dev only)

---

## Troubleshooting

### No metrics appearing

1. Check `/metrics` endpoint returns data
2. Verify Prometheus is scraping the target
3. Check network connectivity

### Sentry not receiving events

1. Verify `SENTRY_DSN` is set correctly
2. Check Sentry project settings
3. Verify events are not being filtered

### Health check failing

1. Check component status: `GET /health/detail`
2. Verify database connectivity
3. Check Redis connection
4. Verify RabbitMQ is running
