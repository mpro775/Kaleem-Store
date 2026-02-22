# Security Hardening Guide

## Overview

This document covers the security measures implemented in Kaleem Store.

---

## 1. CORS Configuration

### Dynamic CORS for Custom Domains

The system automatically allows requests from active custom domains.

```typescript
// CORS is evaluated dynamically based on:
// 1. Static allowed origins (ALLOWED_ORIGINS env var)
// 2. Active custom domains from database
```

### Configuration

```bash
# Static origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,https://admin.example.com

# Cache settings
CORS_CACHE_TTL_MS=60000           # Cache TTL for domain lookups
CORS_CACHE_REFRESH_INTERVAL_MS=30000  # Background refresh interval
```

### Adding Custom Domains

When a domain is activated, it's automatically added to CORS whitelist:

1. Domain is verified
2. Domain is activated
3. Domain is cached for CORS
4. Requests from domain are allowed

---

## 2. Brute Force Protection

### Configuration

```bash
AUTH_MAX_ATTEMPTS=5           # Max failed attempts before lockout
AUTH_LOCKOUT_DURATION_MS=900000  # Lockout duration (15 minutes)
AUTH_WINDOW_MS=900000         # Time window for counting attempts (15 minutes)
```

### How It Works

1. Failed login attempts are tracked per IP + identifier
2. After `AUTH_MAX_ATTEMPTS` failures, account is locked
3. Lockout duration is `AUTH_LOCKOUT_DURATION_MS`
4. Successful login clears the attempt counter

### Usage in Auth Service

```typescript
// Check if locked
const { locked, remainingMs } = bruteForceGuard.isLocked(email, ip);
if (locked) {
  throw new TooManyRequestsException(
    `Account locked. Try again in ${Math.ceil(remainingMs / 60000)} minutes`,
  );
}

// On failed login
bruteForceGuard.recordFailedAttempt(email, ip);

// On successful login
bruteForceGuard.recordSuccessfulAttempt(email, ip);
```

---

## 3. Password Policy

### Requirements

| Requirement           | Value                 |
| --------------------- | --------------------- | -------- |
| Minimum length        | 8 characters          |
| Maximum length        | 128 characters        |
| Uppercase letters     | Required              |
| Lowercase letters     | Required              |
| Numbers               | Required              |
| Special characters    | Required (1 minimum)  |
| Allowed special chars | `!@#$%^&\*()\_+-=[]{} | ;:,.<>?` |

### Validation

```typescript
import { PasswordPolicyService } from './security/password-policy.service';

// Validate password
const result = passwordPolicyService.validate(password);
if (!result.valid) {
  console.log(result.errors); // ['Password must contain at least one uppercase letter', ...]
  console.log(result.score); // 0-100
}

// Or throw on invalid
passwordPolicyService.validateOrThrow(password);
```

### Blocked Patterns

- Common passwords (password123, admin, etc.)
- Repeating characters (aaa, 111)
- Sequential characters (abc, 123, xyz)

### Password Generation

```typescript
// Generate secure password
const password = passwordPolicyService.generatePassword(16);
```

---

## 4. Webhook Signing

### Purpose

Ensure webhook payloads are authentic and not tampered with.

### Signing Process

```typescript
import { WebhookSigningService } from './security/webhook-signing.service';

// Sign a webhook payload
const payload = {
  id: 'evt_123',
  eventType: 'order.created',
  timestamp: new Date().toISOString(),
  storeId: 'store_123',
  data: { orderId: 'order_456' }
};

const { signature, timestamp } = webhookSigningService.signPayload(payload);

// Include in headers
headers: {
  'x-webhook-signature': signature,  // sha256=...
  'x-webhook-timestamp': timestamp   // Unix timestamp
}
```

### Verification

```typescript
// Verify incoming webhook
const result = webhookSigningService.verifyHeaders(
  payload,
  {
    'x-webhook-signature': signature,
    'x-webhook-timestamp': timestamp,
  },
  storeWebhookSecret,
);

if (!result.valid) {
  throw new UnauthorizedException(result.error);
}
```

### Timestamp Protection

- Webhooks with timestamps older than 5 minutes are rejected
- Prevents replay attacks

---

## 5. Security Headers

Headers are set via Helmet middleware:

```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 6. Request ID Tracking

Every request gets a unique ID for tracing:

```bash
# Request ID header
X-Request-Id: uuid-v4

# Included in logs
[INFO] [req-abc123] User logged in
```

---

## 7. Audit Logging

Sensitive operations are logged to `audit_logs` table:

| Event           | Logged Fields                    |
| --------------- | -------------------------------- |
| Login failure   | email, ip, user_agent            |
| Role change     | user_id, old_role, new_role      |
| Price change    | product_id, old_price, new_price |
| Theme publish   | store_id, theme_version          |
| Domain activate | store_id, hostname               |

---

## 8. Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables (not in code)
- [ ] `SENTRY_DSN` configured for error tracking
- [ ] `WEBHOOK_SECRET` is a strong random string
- [ ] `JWT_ACCESS_SECRET` is at least 24 characters
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled on sensitive endpoints
- [ ] HTTPS enforced in production

### Regular Reviews

- [ ] Rotate secrets quarterly
- [ ] Review audit logs weekly
- [ ] Test backup restore monthly
- [ ] Update dependencies for security patches
- [ ] Review failed login patterns

---

## 9. Incident Response

### Suspected Breach

1. **Isolate**: Revoke all active sessions
2. **Investigate**: Check audit logs for anomalies
3. **Notify**: Inform affected stores
4. **Remediate**: Force password reset if needed
5. **Document**: Record incident details

### Key Commands

```bash
# Revoke all sessions for a user
# (via API or direct DB)

# Force password reset
# (via API or direct DB)

# Check recent audit events
docker exec kaleem-postgres psql -U kaleem -d kaleem_store -c "
  SELECT * FROM audit_logs
  WHERE created_at > NOW() - INTERVAL '24 hours'
  ORDER BY created_at DESC;
"
```
