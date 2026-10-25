# Event، اعلان و Integration

## Event envelope
`id`, `type`, `version`, `occurredAt`, `workspaceId`, `actorId?`, `aggregateType`, `aggregateId`, `correlationId`, `data` حداقلی. schema version و backward compatibility را تعریف کن؛ payload حاوی secrets/PII بدون ضرورت ممنوع.

## Notification lifecycle
queued → processing → delivered / failed-retryable / dead-letter / cancelled. Channel (in-app/email/push) و user preferences جدا. Provider outage نباید transaction اصلی CRM را به timeout طولانی ببرد. delivery idempotency، retry cap، DLQ و وضعیت قابل پشتیبانی برای support/admin.

## Webhooks
HMAC/signature یا روش امن provider؛ timestamp/replay guard؛ retries؛ delivery history؛ rotation؛ secret encryption؛ timeout؛ محدودیت payload؛ URL allow/block policy و محافظت SSRF (loopback/private/link-local/metadata IP، DNS rebinding، redirect validation)؛ عدم نمایش secret پس از ایجاد.

## Integration setup UX
connection status، last sync، granted scopes، mapped fields، sample/test connection، retry, pause/disconnect، rate limit و error runbook. دکمه «Connected» نباید صرفاً به خاطر ذخیره‌شدن credential روشن شود؛ actual health/handshake لازم است.

## Automation
Trigger + conditions + actions typed، validation، dry-run/sample event، versioned publish، run history، retry/cancel، loop prevention، per-tenant limits و permissions. workflow editor هرگز code/eval آزاد از end-user اجرا نکند.
