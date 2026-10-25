# مرزهای Backend و Vertical Slice

## پیشنهاد مرزبندی
سازمان و هویت؛ CRM (Leads/Accounts/Contacts/Deals/Pipelines); Work (Projects/Tasks/Boards/Time); Support (Tickets/Queues/SLA/Knowledge); Collaboration (Comments/Files/Activity); Search; Automation; Notification; Reporting; Integrations; Audit; Billing/Usage فقط اگر نیاز محصول تأیید شد.

این‌ها boundaryهای دامنه‌اند، نه دستور ساخت microservice. شروع پیشنهادی modular monolith با NestJS moduleهای محدود و dependency direction روشن است. هر ماژول owner داده خود است؛ دسترسی مستقیم module دیگر به جدول‌های داخلی بدون contract ممنوع.

## Vertical slice نمونه: Lead
- Controller: HTTP/auth boundary، DTO parsing و response codes.
- Application use case: `CreateLead`, `AssignLead`, `ConvertLead`.
- Domain: invariantها، state transition و rules.
- Repository port: interface؛ implementation Prisma در infrastructure.
- Transaction: نوشتن record و audit/outbox مرتبط با هم.
- Event handler/worker: side-effectهای غیرتراکنشی مثل email/notification.
- Tests: domain unit؛ repository integration با PostgreSQL؛ API integration شامل cross-tenant denial؛ Playwright E2E مسیر کاربر.

## Transactional outbox
اگر یک تغییر database باید notification/event ایجاد کند، رکورد domain و outbox در یک transaction ذخیره می‌شوند. Worker تحویل را at-least-once فرض می‌کند؛ handler باید idempotent باشد. DLQ، retry/backoff، visibility timeout و ابزار replay با permission/audit لازم‌اند.

## قراردادهای خروجی
هر module باید `module-contract.md` یا معادل داشته باشد: routes, commands/queries, events, entities, permissions, errors, metrics, migrations, tests, owned files. ایجاد abstraction بدون consumer واقعی یا استفاده از pattern صرفاً برای شبیه‌شدن به معماری enterprise ممنوع.
