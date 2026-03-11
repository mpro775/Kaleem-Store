# Rollback Plan

## Trigger Conditions

Rollback is required when any of the following happens after deployment:

- sustained 5xx spike above threshold for 5+ minutes
- checkout/payment critical failure
- data corruption risk detected
- domain routing or SSL activation failing broadly

## Rollback Strategy

1. **Application rollback first**
   - roll API/admin/storefront to the previous stable version
2. **Traffic stabilization**
   - verify health probes and routing behavior
3. **Data safety check**
   - confirm no partially applied destructive migration exists

## Database Migration Rule

- Never run destructive down migrations in panic mode unless explicitly approved.
- Prefer forward-fix migration after application rollback when data has already shifted.

## Minimal Command Sequence

- redeploy previous image/tag for API
- redeploy previous image/tag for admin
- redeploy previous image/tag for storefront
- validate `GET /health/ready`

## Verification After Rollback

- auth/login works
- product listing and storefront load
- checkout flow is functional
- payment status transitions are functional
- webhook retries continue without crashing workers

## Communication Template

- incident id
- rollback reason
- affected window
- status after rollback
- next remediation action and owner
