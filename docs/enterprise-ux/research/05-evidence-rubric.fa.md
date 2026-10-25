# Evidence rubric — از roadmap تا production

برای هر feature یک status واحد با لینک مدرک:
- `NOT_ASSESSED`: بررسی نشده.
- `DISCOVERED`: در UI/code/doc علامتی پیدا شده؛ عملکرد هنوز ثابت نشده.
- `DESIGNED`: behavior، API، states و acceptance criteria مصوب دارد.
- `IMPLEMENTED`: کد و route وجود دارد؛ هنوز evidence اجرا ناکافی است.
- `TESTED`: تست قابل تکرار روی commit مشخص pass شده.
- `STAGING_VERIFIED`: staging با داده و نقش واقعی کنترل‌شده از smoke/E2E عبور کرده.
- `PRODUCTION_VERIFIED`: telemetry/acceptance production و owner مشخص مدرک دارد.
- `BLOCKED`: dependency، decision یا محیط مانع است؛ blocker/owner/next step اجباری.

## Evidence tuple
`featureId, status, commitSha, environment, command/testId, result, artifactURL/path, reviewer, checkedAt, knownLimitations`.

## Maturity score (0–5)
0 absent؛ 1 concept/mock؛ 2 happy path partial؛ 3 persistence + validation + permission؛ 4 failure/recovery/automation/telemetry + tests؛ 5 operational evidence (SLO/restore/incident/privacy/a11y as relevant). امتیاز بدون evidence فقط estimate است و نباید به‌عنوان audit pass منتشر شود.
