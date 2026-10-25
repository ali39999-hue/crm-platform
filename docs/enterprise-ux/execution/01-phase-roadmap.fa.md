# فازبندی اجرایی: از اسکلت تا CRM سازمانی

## قانون کلی
فازها را بر اساس dependency اجرا کن، نه زیبایی ظاهری یا تعداد صفحه. هر فاز خروجی قابل تست و معیار عبور دارد. route inventory یک target map است؛ پیش از پیاده‌سازی، با سورس فعلی تطبیق داده شود.

## Phase 0 — Evidence baseline و inventory
**خروجی:** commit baseline، وضعیت CI، route/API/model/service inventory، لیست mock/stub، current screenshots، dependency graph، error log.
**تسک‌ها:** install؛ lint/typecheck/test/build؛ بررسی GitHub Actions؛ ثبت commandهای reproducible؛ کاتالوگ all routes؛ وضعیت هر feature با evidence rubric.
**Gate:** هیچ‌کس از روی README «implemented» فرض نکند؛ blockers دارای owner و log هستند.

## Phase 1 — Identity، workspace و security
**خروجی:** session معتبر، sign-in/refresh/logout/expiry، membership، RBAC/policy و tenant isolation.
**تسک‌ها:** حذف اعتماد به identity header غیرقابل‌اعتبارسنجی؛ server guards؛ resource-scoped authorization؛ audit و denied-path tests؛ revoke/session expiry.
**Gate:** تمام E2Eهای cross-tenant و IDOR منفی pass؛ هیچ مسیر حساس با role فقط در client محافظت نشده.

## Phase 2 — Design system و shell
**خروجی:** tokens منبع حقیقت، typography/spacing, color, focus, dark/light در صورت محصول، navigation, breadcrumbs, search shell, notifications, command palette، RTL.
**تسک‌ها:** review tokens فعلی؛ story catalog؛ buttons/forms/selects/dialog/toast/table/empty/error/loading; route shell responsive؛ keyboard support.
**Gate:** component states documented؛ screenshots برای 320/390/768/1440؛ axe و keyboard checks برای shell.

## Phase 3 — CRM vertical slice کامل
**خروجی:** Lead end-to-end واقعی؛ سپس Account/Contact/Deal.
**تسک‌ها:** list/detail/create/edit; server filtering/sort/pagination; assignment; notes/activity timeline; relation links; validation; optimistic conflict; archive; audit; permission; persistence.
**Gate:** ایجاد از UI در database باقی بماند پس از refresh/re-login؛ failure و permission states تست شوند؛ CRUD از fake data استفاده نکند.

## Phase 4 — Work management
**خروجی:** project/task/board/backlog/saved views و ارتباط به CRM records.
**تسک‌ها:** status transition rules؛ keyboard-operable board؛ bulk actions؛ task relations؛ assignee/due date; conflict; history; filters؛ calendar if planned.
**Gate:** API persistence/permissions/E2E؛ board برای keyboard و touch قابل استفاده؛ state پس از refresh پایدار.

## Phase 5 — Support و customer portal
**خروجی:** ticket queue، detail، reply/public vs internal note، assignment، SLA، portal scope.
**تسک‌ها:** conversation model؛ unread; customer identity; public response guard؛ assignment/team routing؛ SLA metrics؛ attachment scans/access؛ customer portal read-own-only.
**Gate:** internal notes هرگز به مشتری نرسند؛ tenant/customer isolation تست‌شده؛ core ticket E2E pass.

## Phase 6 — Global search، collaboration و notifications
**خروجی:** جست‌وجوی permission-aware، mention/comments، in-app notification و notification preferences.
**تسک‌ها:** query schema؛ index permissions؛ reindex؛ notification outbox؛ idempotent worker؛ read/unread؛ preference; deep link.
**Gate:** جست‌وجو داده tenant دیگر را برنگرداند؛ worker retry duplicate side effect نسازد؛ provider outage عملیات اصلی را خراب نکند.

## Phase 7 — Automation، reports و integrations
**خروجی:** workflow definitions versioned؛ run history؛ dashboards با data scope روشن؛ integrations با status واقعی.
**تسک‌ها:** rule validation، dry-run، trigger/action registry، loop detection، limits؛ report builder allow-list؛ webhook delivery history؛ secret rotation و SSRF controls.
**Gate:** workflow را بتوان pause/retry/cancel کرد؛ reports با data permission تست؛ external integration دارای test connection و observable failure.

## Phase 8 — Import/export و migration quality
**خروجی:** import preview، field mapping، duplicate handling، bulk validation، export کنترل‌شده.
**تسک‌ها:** CSV/XLSX parsing امن؛ formula injection guard؛ limits/async jobs؛ rollback/compensation behavior؛ export expiry; audit.
**Gate:** dry run با error report؛ tenant scope؛ backup/migration rehearsal و test داده بزرگ.

## Phase 9 — Mobile، RTL، i18n و accessibility
**خروجی:** responsive web و mobile workflows؛ offline فقط اگر queue/sync واقعی پیاده شود.
**تسک‌ها:** RTL logical properties؛ locale/calendar/timezone؛ mobile navigation؛ focus/keyboard/reduced motion؛ axe + manual review؛ offline mutation queue/idempotency/conflict.
**Gate:** core paths 320–430px، keyboard-only و screen reader spot check؛ mobile sync با server evidence نه toast.

## Phase 10 — Operations و pilot
**خروجی:** dashboards، SLO، alerting، restore drill، runbooks، pilot users feedback و production sign-off.
**تسک‌ها:** performance/load profiles؛ slow query; queue depth/age؛ privacy/retention؛ support/runbook; rollout/rollback; feature flag؛ user telemetry minimization.
**Gate:** CI سبز روی commit release، no open P0، P1 risk acceptance، backup restore evidence، named owner و incident contact.

## تعریف Done هر task
کد + تست + docs/contract + permission review + UX states + evidence + observability لازم. تغییر فقط به خاطر build success کامل نیست. اگر task blocked است، `BLOCKED` و blocker/owner/next step ثبت شود؛ نه اینکه با stub به Completed تغییر کند.
