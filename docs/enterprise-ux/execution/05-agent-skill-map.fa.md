# نقشه مهارت‌های Agent برای اجرا

این‌ها قراردادهای مهارتی پروژه‌اند؛ به‌تنهایی جای نصب یا پیکربندی skill runtime را نمی‌گیرند. در صورت تبدیل به `.agents/skills/*/SKILL.md`، schema و conventions موجود مخزن اول بررسی شود.

| Skill | Trigger | ورودی | خروجی قابل ارزیابی |
|---|---|---|---|
| `repo-baseline-audit` | شروع هر فاز/قبل از تغییر معماری | repo + commit | inventory، command results و evidence levels |
| `route-inventory-sync` | تغییر route/page/navigation | App Router + route CSV | diff route target/actual، orphan links و role map |
| `enterprise-ux-implementation` | ساخت یا اصلاح screen | UX spec + current UI | route واقعی با تمام stateها، responsive و screenshot |
| `design-system-governance` | component/token تغییر می‌کند | token source + Storybook | token diff، component stories، visual/a11y evidence |
| `api-contract-first` | endpoint یا schema تغییر می‌کند | OpenAPI + DTOs | request/response/error/auth contract و drift test |
| `tenant-security-review` | هر CRUD/search/export/integration | policy + entities | allow/deny matrix، cross-tenant test و remediation |
| `vertical-slice-builder` | پیاده‌سازی feature اصلی | domain contract | UI→API→DB→audit→test end-to-end |
| `benchmark-research` | بررسی Didar/Jira/open source | source URLs + scenario | walkthrough matrix، Adopt/Adapt/Reject، license note |
| `rtl-a11y-review` | هر صفحه جدید یا design-system change | routes + locale | keyboard/RTL/contrast/zoom report با screenshot |
| `e2e-quality-gate` | PR/release | test plan + staging | repeatable test results، flaky analysis و evidence |
| `data-migration-review` | schema/migration/import/export | migrations + dataset profiles | migration rehearsal، rollback/forward strategy |
| `release-evidence-auditor` | پایان فاز/RC | CI, tests, runbooks | signed gate report، unresolved risks و release decision |

## Skill safety rules
- Skill must declare tools, file scope, read/write mode, and stop conditions.
- Read-only audit agents cannot edit files. Benchmark agent cannot scrape authenticated pages or bypass restrictions.
- Frontend agent cannot mark backend feature implemented without API/DB evidence.
- Any authorization/security finding blocks feature completion until severity disposition is reviewed.
- Keep one owner per file area for parallel agents; use small PRs and merge conflicts deliberately resolved.
