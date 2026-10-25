# Performance و Reliability budget

اعداد زیر هدف اولیه برای اندازه‌گیری و توافق تیم‌اند، نه ادعای نتیجه فعلی. پس از baseline با داده و محیط واقعی tune شوند.

| ناحیه | هدف اولیه | مدرک |
|---|---|---|
| route تعاملی حیاتی | LCP p75 ≤ 2.5s و INP p75 ≤ 200ms در داده میدانی | RUM و trace |
| API read مهم | p95 ≤ 400ms در load profile توافق‌شده | load test / APM |
| API mutation معمول | p95 ≤ 700ms بدون side effect خارجی synchronously | APM |
| خطای 5xx | dashboard و alert بر اساس SLO | metric/alert test |
| queue age | alert برای oldest job و retry storm | worker metrics |
| database | slow query, pool saturation, lock wait | SQL telemetry |
| search/index | freshness target و lag gauge | index metrics |

## Reliability checklist
- timeout deadline end-to-end؛ retry فقط برای error قابل retry و operation امن.
- exponential backoff + jitter، retry budget و circuit breaker برای providerهای ناپایدار.
- idempotency برای mutation حساس و webhook delivery.
- graceful degradation برای search/notification؛ عدم block کردن CRUD اصلی با سرویس ثانویه.
- DB connection pool، query plan، index و N+1 بررسی شود.
- request ID، trace ID، tenant-safe logs و redaction.
- SLO error budget و incident runbook.
- backup restore drill، migration rehearsal و rollback/forward-fix plan.
