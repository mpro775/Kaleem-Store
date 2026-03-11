# Incident Response Runbook

## Severity Levels

- **SEV-1:** checkout, auth, or data integrity outage
- **SEV-2:** major feature degradation (domains/webhooks/payments)
- **SEV-3:** partial degradation with workaround

## First 10 Minutes

- create incident channel
- assign incident commander
- assign ops owner and communications owner
- capture current release version and recent deploy hash

## Technical Triage

1. check API health and component checks:
   - `/health/ready`
   - `/health/component/storage`
2. inspect logs/metrics for:
   - webhook failures
   - payment receipt update failures
   - domain ssl sync failures
   - checkout exceptions
3. decide mitigation path:
   - config fix
   - feature flag disable
   - rollback

## Containment Actions

- pause high-risk jobs if they amplify failure
- reduce traffic pressure if needed
- disable affected integration path (example: manual webhook retries only)

## Recovery Validation

- smoke test core flows:
  - login
  - product listing
  - checkout
  - payment review
  - webhook delivery
  - custom domain SSL sync

## Postmortem Requirements

- timeline with UTC timestamps
- root cause and contributing factors
- customer impact summary
- corrective actions with owners and deadlines
