# رودمپ مادر ارتقای `crm-platform` به CRM سازمانی

**تهیه:** ۲۴ اکتبر ۲۰۲۶ | **مخزن مقصد:** https://github.com/ali39999-hue/crm-platform

## تصمیم اجرایی
راه درست، ساخت یک محصول یکپارچه از مسیرهای کوچک و کامل است، نه طراحی جداگانه ۱۰۰ صفحه و اتصال دیرهنگام. اول هویت/tenant و قرارداد API، سپس design system، سپس یک vertical slice واقعی، بعد گسترش به سایر دامنه‌ها.

## خروجی‌های بسته
این رودمپ با مجموعه `CRM-Platform-Enterprise-UX-Implementation-Pack` همراه است و موارد زیر را دارد:
- route inventory هدف با بیش از ۹۰ مسیر، نقش‌ها، اولویت، قرارداد داده و minimum tests؛
- سند مستقل برای shell، home، CRM، projects/tasks، support، collaboration، reporting، automation، admin، customer portal، auth، mobile و RTL؛
- catalog اجزا و design token proposal؛
- قرارداد frontend/API، backend modules، database/tenant، authorization/audit، events/integrations؛
- QA strategy، visual QA، performance/reliability و release gates؛
- CSV منابع متن‌باز برای benchmark و collector عمومی GitHub metadata؛
- بک‌لاگ قابل واردکردن به Jira/Linear/مشابه با task ID، dependencies و acceptance criteria؛
- promptهای جداگانه برای agentهای audit، UI، vertical slice، support، QA، benchmark و security.

## ترتیب فازها
0. Baseline + route/API/model inventory + CI.
1. Auth, session, workspace membership, policy, audit.
2. Design tokens, accessible primitives, navigation shell.
3. CRM Lead vertical slice از UI تا PostgreSQL با permission و tests.
4. Account/Contact/Deal + views/import/export.
5. Project/Task/Board/Calendar.
6. Support ticket/queue/SLA/customer portal.
7. Search, comments, notifications, outbox.
8. Workflow automation, reports, webhooks/integrations.
9. Mobile/RTL/i18n/accessibility.
10. Performance, SLO, restore drill, pilot و release.

## Definition of Done
- [ ] UI action به API واقعی وصل است؛ موفقیت قبل از server confirmation اعلام نمی‌شود.
- [ ] داده پس از refresh/re-login/restart پایدار است.
- [ ] workspace/role/resource authorization سمت سرور و آزمون deny دارد.
- [ ] loading, empty, no-results, error, forbidden, validation, conflict, retry و saving در صورت نیاز پیاده‌اند.
- [ ] unit/integration/E2E مناسب به CI وصل است.
- [ ] RTL/mobile/keyboard/a11y برای routeهای اصلی بررسی شده.
- [ ] screenshots، run link، commit SHA و known gaps ثبت شده‌اند.
- [ ] تمام release gates مرتبط pass شده‌اند.

## منابع اصلی برای مشاهده
- Twenty: https://github.com/twentyhq/twenty
- Frappe CRM: https://github.com/frappe/crm
- Plane: https://github.com/makeplane/plane
- OpenProject: https://github.com/opf/openproject
- Chatwoot: https://github.com/chatwoot/chatwoot
- TanStack Table: https://github.com/TanStack/table
- TanStack Query: https://github.com/TanStack/query
- Radix UI: https://github.com/radix-ui/primitives
- Storybook: https://github.com/storybookjs/storybook
- Playwright: https://github.com/microsoft/playwright

این‌ها برای استخراج الگو هستند، نه کپی بی‌بررسی. قبل از استفاده از کد/asset، LICENSE و شرایط نسخه دقیق بررسی شود. اسکرپ باید عمومی، مجاز و rate-limited باشد؛ برای metadata مخازن از GitHub REST API استفاده کنید.

## محدودیت وضعیت فعلی
این بسته roadmap و specification است، نه محصول پیاده‌سازی‌شده. هیچ تغییر remote/push/deploy انجام نشده است. هدف routeها باید با سورس واقعی، staging و runهای CI تطبیق داده شود؛ status هر قابلیت فقط با evidence قابل تغییر است.
