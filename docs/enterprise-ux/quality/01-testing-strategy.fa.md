# راهبرد آزمون CRM

## لایه‌ها و نسبت
- Unit: domain rules، reducers، schema validation، formatters و permission policies بدون I/O.
- Component: form، data table، command palette، dialog، board، detail panel و تمام stateهای قابل مشاهده.
- Integration: PostgreSQL واقعی/test container، migrations، API modules، auth/tenant boundaries، outbox و job handler.
- Contract: OpenAPI schema، generated client drift و integration adapter contracts.
- E2E: مسیرهای حیاتی با نقش‌های متفاوت در browser واقعی؛ اجرا روی seed پایدار.
- Visual: screenshot baseline در viewport، theme و locale ثابت؛ تغییرها reviewed، نه کورکورانه auto-accept.
- Accessibility: axe + keyboard/manual checks برای مسیرهای منتخب.
- Load/resilience: critical endpoint، query p95، queue retry، provider outage و DB pool.

## حداقل E2E P0
1. sign-in/session expiry/logout؛ role revoke.
2. workspace A تلاش به خواندن/تغییر record متعلق به workspace B.
3. create/update/archive lead، assign owner و add note؛ refresh پس از هر mutation.
4. create ticket، public reply vs internal note و SLA state.
5. task create/assign/status change و concurrent update conflict.
6. import dry-run، validation failures، duplicate behavior و export scoped.
7. route reload/deep link و empty/loading/error/offline states.
8. RTL، keyboard-only، 320px/390px و 200% zoom روی مسیرهای اصلی.

## Test data
Seedها versioned، deterministic و fake هستند؛ PII واقعی یا production snapshot ممنوع. هر تست مستقل، cleanup دارد و به ترتیب اجرای قبلی وابسته نیست.

## Bug template
Severity، affected route/role/locale/viewport، preconditions، numbered reproduction، expected/actual، evidence/screenshot/requestId، regression test، owner و fix version.
