# Sprint 4 Closure Checklist

This checklist is the production sign-off gate for Sprint 4 (Shipping, Promotions, Notifications).

## 1) Code Quality Gates
- [x] `npm run lint`
- [x] `npm run test`
- [x] `npm run build`
- [x] `npm run sast`

## 2) Contract Gates
- [x] OpenAPI regenerated: `npm run openapi:generate`
- [x] Contract review documented: `docs/api/sprint4-contract-review.md`
- [x] Endpoint examples documented: `docs/api/sprint4-endpoint-examples.md`

## 3) Functional Test Coverage (Sprint 4)
- [x] Happy-path API smoke tests (shipping + coupon + checkout)
- [x] Negative API smoke tests (missing coupon, expired coupon, inactive shipping zone, empty cart)
- [x] Notifications worker reliability tests (retry + DLQ + headers)

## 4) Messaging Reliability Gates
- [x] Retry behavior validated in tests
- [x] DLQ handoff validated in tests
- [x] DLQ headers validated in tests (`x-retry-count`, `x-original-routing-key`, `x-failed-reason`)
- [x] Operational runbook updated (`docs/runbooks/messaging.md`)
- [x] Queue health script supports optional threshold checks (`scripts/queue-health.mjs`)

## 5) Environment Integration Gates
- [ ] RabbitMQ port reachable via `npm run queue:health`
- [ ] Database migrations succeed via `npm run migrate:up`
- [ ] End-to-end outbox -> RabbitMQ -> notifications flow verified on real infra

Current local execution notes:
- `docker --version` failed (`command not found`) in this environment.
- `npm run queue:health` failed with `ECONNREFUSED 127.0.0.1:5672`.
- `npm run migrate:up` failed with Postgres auth error (`password authentication failed for user "kaleem"`).

## 6) Final Sign-off Decision
- Status: **Conditionally ready**
- Reason: Code, tests, contracts, and reliability gates are green; infra-dependent runtime checks remain pending in an environment with Docker/RabbitMQ/Postgres access.

## 7) Required Final Verification (on infra-enabled environment)
1. Start infra: `npm run dev:infra`
2. Run migrations: `npm run migrate:up`
3. Start API + workers:
   - `npm run dev --workspace @kaleem/api`
   - `npm run worker:outbox --workspace @kaleem/api`
   - `npm run worker:notifications --workspace @kaleem/api`
4. Execute one checkout flow with coupon + shipping zone.
5. Verify:
   - Outbox pending decreases.
   - RabbitMQ queues stable.
   - `notification_deliveries` receives processed rows.
   - `npm run queue:health` passes.
