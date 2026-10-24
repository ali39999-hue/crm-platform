# پرامپت‌های اجرای پروژه برای Coding Agent

از `AGENTS.md` و `ROADMAP.fa.md` به‌عنوان قرارداد پروژه استفاده کنید. این پرامپت‌ها را **به ترتیب فاز** اجرا کنید؛ همه featureها را در یک prompt واحد نسازید.

## Prompt 0 — Discovery و Bootstrap

> ابتدا فقط فاز Discovery و Bootstrap را اجرا کن. ابتدا مخزن، فایل‌ها، scripts و environment را بررسی کن؛ هیچ production access نخواه. ADRهای tenant model، auth provider، DB/ORM، API style و deployment را ثبت کن. تمام فرض‌ها و سؤال‌های باز را در `docs/` بنویس. monorepo را بدون اضافه‌کردن dependency غیرضروری آماده کن، lockfile ایجاد و commit‌پذیر کن، سپس build/typecheck/test را اجرا کن. هنوز CRUDهای کامل نساز. نتیجه را همراه با فایل‌های تغییرکرده، دستورات اجراشده، خروجی واقعی و ریسک باقیمانده گزارش کن.

## Prompt 1 — Vertical Slice امن

> یک جریان end-to-end محدود بساز: identity/session از provider انتخاب‌شده → membership و workspace → `GET /me` → مشاهده My Work → ایجاد task → تغییر به status مجاز → ثبت audit event → outbox event → notification stub. هر endpoint باید server-side authz و organization scope داشته باشد. تست منفی برای user ناشناس، کاربر بدون permission و cross-org بنویس. contract/OpenAPI و E2E را به‌روز کن. تا زمانی که جریان کامل و تست‌شده نشده، به feature دیگری نرو.

## Prompt 2 — Work Management

> ماژول Task/Project را طبق مدل دامنه پیاده کن. state machine باید central و تست‌شده باشد؛ optimistic concurrency و dependency-cycle check را اعمال کن؛ همه mutationها audit شوند. list/filter/sort/pagination allowlist داشته باشند. loading/empty/error/denied در وب و موبایل اضافه شود. تست integration واقعی با PostgreSQL و E2E برای transition مجاز/نامجاز اجرا کن.

## Prompt 3 — CRM

> Account, Contact, Lead, Deal، timeline و next-action را با domain ownership مشخص پیاده کن. dedup فقط candidate پیشنهاد دهد مگر policy ادغام مصوب باشد. lead conversion idempotent باشد. Customer 360 همه nested resources را با scope اعمال کند. Search، count، export، activity و attachment را در تست‌های cross-org پوشش بده. هیچ PII واقعی را در fixture یا log وارد نکن.

## Prompt 4 — Support و Customer Portal

> ticket lifecycle، assignment، SLA و ticket messages را بساز. `INTERNAL` و `CUSTOMER_SHARED` را به policy واقعی تبدیل کن؛ فقط جدا کردن component UI کافی نیست. Customer Portal باید بر مبنای customer identity، account relationship و endpoint allowlist کار کند. سناریوهای افشای private note/attachment/notification و IDOR را قبل از افزودن قابلیت جدید سبز کن.

## Prompt 5 — Mobile

> اپ را به API contract موجود وصل کن. secure storage، token/session lifecycle، offline/error states، deep-link authorization و notification payload privacy را پیاده کن. در شروع full offline write sync نساز؛ ابتدا cache/read و draft محدود، سپس conflict/idempotency/reauthorization را طراحی کن. `npx expo install --fix` و تست روی iOS/Android انجام بده.

## Prompt 6 — Release hardening

> Release checklist را از روی شواهد پر کن. تست‌های license/security/secret scan، migration validation، permission negative tests، backup/restore، queue failure، provider outage، observability، SLO و rollback را اجرا یا برای موارد غیرقابل اجرا blocker ثبت کن. عبارت‌هایی مثل «production-ready» فقط وقتی مجاز است که evidence و owner داشته باشد. هیچ deploy یا push production انجام نده.

## قالب پاسخ Agent در پایان هر تسک

```text
Outcome:
Acceptance criteria:
Files changed:
DB/API/permission changes:
Commands executed:
Test results (exact):
Evidence / links:
Risks and untested areas:
Rollback / feature flag:
Next recommended task:
```
