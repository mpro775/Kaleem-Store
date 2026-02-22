# Code Review Checklist

- Business logic stays in service/use-case, not controllers.
- DTO validation exists for each input payload.
- Endpoint includes tenant guard + RBAC guard where required.
- Sensitive actions are captured in `audit_logs`.
- New business rules include unit tests.
- New async events use outbox then RabbitMQ publication.
- Consumers are idempotent and covered by retry/DLQ behavior.
