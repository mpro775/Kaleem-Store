# Messaging Runbook (RabbitMQ + Outbox)

## Pattern

- Application writes business data and outbox event in one transaction.
- Outbox worker publishes pending events to RabbitMQ topic exchange.
- On publish failure, event is retried with backoff.
- After max retries, event moves to failed state (DLQ flow in consumer side).

## Workers

- Start outbox publisher: `npm run worker:outbox --workspace @kaleem/api`
- Start notifications consumer: `npm run worker:notifications --workspace @kaleem/api`
- Keep workers in separate terminals from the API process.

## Sprint 4 Notification Topology

- Exchange: `kaleem.events` (topic)
- Main queue: `notifications.order-events`
- Routing keys consumed from main queue bindings:
  - `order.created`
  - `order.status.changed`
  - `inventory.low_stock`
- Retry queues:
  - `notifications.order-created.retry` dead-letters to `order.created`
  - `notifications.order-status.retry` dead-letters to `order.status.changed`
  - `notifications.inventory.retry` dead-letters to `inventory.low_stock`
- DLQ queue: `notifications.order-events.dlq`

## Retry and DLQ Rules

- Consumer increments `x-retry-count` on each failed attempt.
- Failed messages are republished to retry queue with TTL (`NOTIFICATIONS_RETRY_DELAY_MS`).
- After `NOTIFICATIONS_MAX_RETRIES`, message is persisted as `failed` in `notification_deliveries` and copied to DLQ.
- DLQ message headers include:
  - `x-original-routing-key`
  - `x-retry-count`
  - `x-failed-reason`

## Event Headers

- `outboxId`: unique event id from outbox table
- `requestId`: request correlation id when available
- `publishedAt`: ISO timestamp

## Configuration

- `RABBITMQ_URL`
- `RABBITMQ_EXCHANGE`
- `NOTIFICATIONS_MAIN_QUEUE`
- `NOTIFICATIONS_DLQ_QUEUE`
- `NOTIFICATIONS_RETRY_CREATED_QUEUE`
- `NOTIFICATIONS_RETRY_STATUS_QUEUE`
- `NOTIFICATIONS_RETRY_INVENTORY_QUEUE`
- `NOTIFICATIONS_MAX_RETRIES`
- `NOTIFICATIONS_RETRY_DELAY_MS`

## Operational Checks

- Verify RabbitMQ queues from management UI: `http://localhost:15672`
- Run health script: `npm run queue:health`
- Confirm outbox backlog drains:
  - `SELECT status, COUNT(*) FROM outbox_events GROUP BY status;`
- Confirm notification delivery status:
  - `SELECT status, COUNT(*) FROM notification_deliveries GROUP BY status;`

## Queue Health Thresholds

- Port reachability is checked using `RABBITMQ_HOST` and `RABBITMQ_PORT`.
- Optional queue depth checks are enabled when `RABBITMQ_MANAGEMENT_URL` is configured.
- Optional management credentials:
  - `RABBITMQ_MANAGEMENT_USER` (default `guest`)
  - `RABBITMQ_MANAGEMENT_PASSWORD` (default `guest`)
- Queue depth thresholds:
  - `NOTIFICATIONS_MAIN_QUEUE_MAX_MESSAGES` (default `200`)
  - `NOTIFICATIONS_DLQ_QUEUE_MAX_MESSAGES` (default `0`)

## Incident Playbook

- `DLQ growth`:
  - Pause notifications worker.
  - Inspect recent rows in `notification_deliveries` with `status = 'failed'`.
  - Fix root cause (payload shape, downstream dependency, config).
  - Replay DLQ messages to the main queue in controlled batches.
- `Main queue backlog growth`:
  - Verify worker process is running and connected.
  - Increase worker replicas or reduce retry delay temporarily.
  - Check DB health because consumer writes `notification_deliveries`.
- `Outbox pending growth`:
  - Verify outbox worker connectivity to RabbitMQ.
  - Check broker disk/memory alarms.
  - Resume publishing after broker recovery and monitor drain rate.

## Initial Sensitive Events

- `order.created`
- `order.status.changed`
- `payment.receipt.uploaded`
- `payment.status.changed`
- `domain.verified`
- `domain.activated`
- `theme.published`
- `inventory.low_stock`
