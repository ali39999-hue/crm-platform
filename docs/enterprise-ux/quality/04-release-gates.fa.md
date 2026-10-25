# Release Gates — هیچ فاز با ادعا بسته نمی‌شود

## Gate A — Baseline
- [ ] commit، branch، environment و commandها ثبت شده‌اند.
- [ ] install، lint، typecheck، unit، build اجرا شده‌اند یا blocker با log واقعی ثبت شده.
- [ ] inventory route/page/API/model/service تهیه شده؛ stub/mock markerها ثبت شده.

## Gate B — Security foundation
- [ ] session/token واقعی و expiry/revoke.
- [ ] هیچ identity از header کنترل‌نشده trust نمی‌شود.
- [ ] deny-by-default و tenant isolation در API و tests.
- [ ] secrets/PII در log، telemetry، error و artifacts redacted.
- [ ] audit و threat-model review برای pathهای حساس.

## Gate C — Design system
- [ ] tokens از source of truth مصرف می‌شوند؛ proposalها بدون review جایگزین نمی‌شوند.
- [ ] Button/Input/Select/Dialog/Toast/Table/Empty/Error/Loading states مستند و تست دارند.
- [ ] RTL، focus، contrast، keyboard و mobile behavior بررسی شده‌اند.
- [ ] visual snapshots برای shell و حداقل یک vertical slice.

## Gate D — Feature vertical slice
- [ ] route role/permission مشخص.
- [ ] frontend متصل به API و persistence واقعی.
- [ ] loading/empty/error/permission/validation/success state.
- [ ] API unit/integration و UI E2E شامل failure/denied path.
- [ ] audit/telemetry در موارد لازم.

## Gate E — Release candidate
- [ ] تمام CI required checks سبز در همان commit.
- [ ] database migration از نسخه پشتیبانی‌شده تمرین شده.
- [ ] performance و accessibility defects بحرانی صفر.
- [ ] runbook، owner، rollback/forward-fix و backup check حاضر.
- [ ] QA evidence و remaining risks امضا شده.

## Blocker definitions
P0: bypass auth/tenant، data corruption/loss، broken core path، build/deploy impossible. P1: core task unusable یا severe data integrity/accessibility issue. Release با P0 باز ممنوع؛ P1 تنها با risk acceptance صریح و راه‌حل زمان‌بندی‌شده.
