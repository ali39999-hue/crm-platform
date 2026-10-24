# چک‌لیست Release / Production Readiness

## محصول
- [ ] acceptance criteria همه P0ها تأیید شده
- [ ] نقش‌های داخلی و پورتال مشتری جدا و تست شده‌اند
- [ ] RTL/LTR و زبان‌های تأییدشده بازبینی شده‌اند

## امنیت و Privacy
- [ ] threat model و permission matrix به‌روز است
- [ ] تست cross-tenant برای read/write/search/export/file سبز است
- [ ] MFA/admin policy، session revocation و key rotation آماده‌اند
- [ ] secrets scan، dependency scan، license review و SBOM اجرا شده
- [ ] retention، privacy notice، DPA و data residency توسط مالک مربوطه تأیید شده

## داده و عملیات
- [ ] migration plan با روش rollback/roll-forward مستند است
- [ ] backup و restore test اجرا شده و RPO/RTO قابل قبول است
- [ ] health/metrics/logs/traces و alerts آماده‌اند
- [ ] worker retry/DLQ و provider outage آزمایش شده‌اند
- [ ] runbook incident و on-call owner تعیین شده‌اند

## انتشار
- [ ] lockfile committed و CI از `--frozen-lockfile` استفاده می‌کند
- [ ] staging smoke و E2E حیاتی سبز است
- [ ] feature flag و recovery path تست شده
- [ ] دسترسی production محدود و deploy نیازمند approval است
- [ ] پس از rollout، error rate/latency/queue و feedback کنترل می‌شود
