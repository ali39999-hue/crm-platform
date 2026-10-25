# UX مشخصات: Workflow و Automation

ابتدا ruleهای ساده، قابل تست و امن؛ بعد builder بصری گسترده. نمونه: با تغییر stage deal و خالی بودن owner، task review بساز.

## Builder
فهرست workflow با status/owner/trigger/last run/failures. Wizard: name → trigger → conditions → actions → test sample → enable. Preview به زبان روشن؛ disable فوری با audit؛ history/version و reason.

## Execution safety
Asynchronous، idempotent، observable؛ retries محدود/backoff؛ dead letter؛ event catalog typed؛ guard ضد loop (recursion limit/dedupe key). delete/send external/bulk update می‌تواند نیازمند approval باشد. dry-run قبل از enable.

## Run history
Status، times، trigger ref، step states، sanitized logs، retry، correlation ID و next action. Secret/PII در log ممنوع.

## Acceptance
یک workflow با event واقعی end-to-end؛ duplicate event تکرار mutation نمی‌سازد؛ disabled workflow کاری انجام نمی‌دهد؛ failure و retry/audit قابل مشاهده است.
