# Promptهای اجرایی Coding Agent — استفاده جداگانه و قابل ارزیابی

## دستور مشترک برای تمام Agentها

تو روی repo موجود `ali39999-hue/crm-platform` کار می‌کنی. قبل از تغییر، `AGENTS.md`، README، roadmap، package scripts، architecture docs و مسیرهای مرتبط را بخوان. stack و patternهای موجود را بی‌دلیل عوض نکن. secret/production data جمع‌آوری نکن. هیچ capability را mock موفقیت‌آمیز جا نزن. هیچ push/deploy یا destructive operation بدون مجوز صریح انجام نده. یک task یا یک vertical slice را در هر PR تمام کن. در پایان فایل‌های تغییرکرده، commandهای اجراشده، نتیجه دقیق، test evidence، risk و کار باقیمانده را بنویس.

**Definition of Done مشترک:** server permission، persistence واقعی، حالات loading/empty/error/forbidden/conflict، تست مثبت و منفی، accessibility/responsive review در سطح مرتبط، docs/contracts به‌روز، CI checks و evidence قابل بازتولید. اگر محیط اجرا در دسترس نیست `NOT_VERIFIED` بگذار.

## Agent A — Read-only baseline auditor

هیچ فایلی را تغییر نده. inventory واقعی routeها، API endpoints، modules, Prisma models, repositories, auth guards, external integrations, tests و mock/in-memory implementation بساز. هر row یک path/symbol/line و وضعیت evidence داشته باشد. دستورات install/lint/typecheck/test/build را فقط طبق repo انجام بده و نتایج دقیق و log excerpt ثبت کن. مواردی که از سورس استنتاج شده را از موارد اجراشده جدا کن. خروجی: `audit/baseline-inventory.csv` و `audit/baseline-report.md` (پیشنهاد ایجاد فایل، نه ادعای وجود).

## Agent B — Design-system foundation

اسناد UX و tokenهای فعلی را بخوان. قبل از تغییر tokens، diff پیشنهادی با `packages/design-tokens/tokens.json` بساز و conflicts را فهرست کن. با یک PR محدود، shell و primitives با stateهای documented ایجاد کن. Button, Input, Select, Dialog, Toast, Table, EmptyState, ErrorState, Loading/Skeleton, StatusBadge باید story/test داشته باشند. مسیر اصلی یک vertical slice را انتخاب کن، نه بازطراحی کور تمام صفحه‌ها. RTL، keyboard، responsive و contrast را تست کن. از شبیه‌سازی لوگو/asset برندهای دیگر پرهیز کن.

## Agent C — Route & information architecture

موجودیت routeهای فعلی را از سورس parse/تأیید کن و با `ux/01-page-route-inventory.csv` مقایسه کن. ستون `actual_status`, `source_path`, `api_dependency`, `permission`, `tests` را در یک report کاندید اضافه کن. route جدید نساز تا نیاز/duplicate مشخص شود. orphan links، duplicate patterns، dead buttons، missing states و role-incorrect navigation را ثبت کن. خروجی باید count و evidence داشته باشد.

## Agent D — CRM Lead vertical slice

یک entity (Lead) را کامل از UI تا API/database اجرا کن. model/DTO/schema، auth + workspace policy، validation، repository Prisma، transaction/audit، list filters/pagination, create/edit/detail, assignment, activity timeline, error mapping و E2E را پوشش بده. بعد از reload/restart داده باید باقی بماند. از fixture فقط در test استفاده کن. Add a negative test for cross-tenant access and another for insufficient permission. PR را به Account/Contact/Deal گسترش نده تا slice مستقل و green شود.

## Agent E — Support queue

اول schema و visibility rules را مشخص کن: public reply، internal note، event/attachment access. سپس queue/list/detail/assignment/status/reply، optimistic concurrency، search، notification/outbox، SLA و portal boundary را در مراحل مستقل بساز. E2E باید prove کند internal note برای external customer غیرقابل‌مشاهده است. notification failure نباید ذخیره تیکت را rollback کند؛ از outbox/integration pattern موجود استفاده کن.

## Agent F — API integration / remove fake state

routeهای فرانت را در scope فعلی بررسی کن. هر event handler که business record را فقط در local state تغییر می‌دهد یا success toast قبل از سرور نشان می‌دهد فهرست کن. API client و schema قرارداد موجود را استفاده کن؛ اگر وجود ندارد، contract ابتدا تعریف و review شود. loading, empty, API error, permission denied, validation, stale/conflict و retry اضافه کن. هر fake/mock فقط test/development flag صریح داشته باشد؛ در production bundle path نباشد.

## Agent G — Quality / E2E / accessibility

P0 journeyها را با Playwright و deterministic seed تست کن. شامل authentication, tenant isolation, CRM CRUD, work item, ticket public/internal visibility, import/export guard, deep links, RTL mobile. screenshot baseline فقط after human review. axe violations را با route/selector/impact و manual keyboard notes ثبت کن. flakey test را با retry افزایش‌یافته پنهان نکن؛ علت را اصلاح یا blocker را گزارش کن.

## Agent H — Public-source benchmark researcher

فقط public/demo/sourceهای قانونی را بررسی کن. برای هر source link، date/version، license evidence، route walkthrough، observed pattern، accessibility/mobile states، Adopt/Adapt/Reject و محدودیت‌ها ثبت کن. از login bypass، anti-bot bypass، credential scraping، asset/code copying بدون license و ذخیره داده خصوصی اجتناب کن. برای repo metadata از `scripts/collect_github_metadata.py` استفاده کن. خروجی: benchmark matrix کامل با evidence path.

## Agent I — Security reviewer

Read-only threat review در ابتدا: auth/session, tenant scoping, IDOR, role policy, webhook SSRF, export, upload/download, CSV formula injection, sensitive logs, secret handling, rate limits, mass assignment و audit. هر finding دارای severity، attack precondition، source location، impact، remediation و test proposal باشد. بعد از اصلاح، verify مجدد در یک محیط تست مجاز. هیچ exploit علیه production یا tenant واقعی اجرا نکن.

## PR body اجباری
- مسئله/business outcome:
- route/role/locale/viewport:
- files/modules touched:
- API/model/migration changes:
- permission/threat consideration:
- tests run and exact result:
- screenshots/before-after:
- evidence and commit SHA:
- known gaps/rollback:
