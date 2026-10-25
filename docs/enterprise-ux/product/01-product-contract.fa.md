# قرارداد محصول و دامنه نسخه‌بندی‌شده

| گروه | کار اصلی | سیگنال موفقیت |
|---|---|---|
| Sales rep | lead، تماس، deal و follow-up | زمان کمتر برای next action و نرخ تکمیل فعالیت |
| Account manager | نمای 360 مشتری و ریسک‌ها | timeline کامل و taskهای overdue کمتر |
| Support agent | queue، ticket، reply و SLA | زمان پاسخ/حل و نرخ reopen |
| Contributor | اولویت، وضعیت، وابستگی و اقدام بعدی | زمان یافتن task و چرخه تکمیل |
| Team lead | workload و blocker | توزیع کار و کاهش SLA breach |
| Organization admin | اعضا، role، fields، workflow، integrations | self-service تنظیمات مجاز |
| Customer portal user | درخواست‌ها و اسناد مجاز | self-service resolution |
| Auditor | چه کسی چه کاری کرده | audit کامل و قابل جست‌وجو |

## مرزبندی MVP

### P0
- ورود امن، session lifecycle، عضویت سازمان و مجوز.
- shell، workspace switcher، global search، notification و error boundaries.
- accounts، contacts، leads/deals، activities/tasks و timeline.
- list/detail/create/edit با pagination/filter/search و persistence واقعی.
- tenant isolation، audit و تست unit/integration/E2E مسیرهای اصلی.

### P1
- Kanban، saved views، comments/mentions، bulk actions، tickets/SLA، projects/boards، calendar.
- notification delivery واقعی، attachment با policy، report پایه، import/export امن و mobile My Work.

### P2
- custom objects/field builder کامل، automation بصری پیچیده، marketplace، offline sync کامل، AI و analytics بزرگ.
- microservices/search cluster فقط با داده telemetry و ADR.

## Non-goals شروع

بازسازی همه قابلیت‌های Jira/Salesforce در یک release؛ چسباندن چند پروژه کامل به هم؛ dashboard تزئینی؛ realtime یا microservices صرفاً برای جلوه مدرن؛ ادعای offline readiness بدون conflict/retry tests.

## قرارداد پذیرش فیچر

هر فیچر باید actor، JTBD، route، permission، data contract، states، analytics event، failure mode، accessibility، mobile behavior و criteria داشته باشد. موارد نامعلوم discovery task بمانند نه حدس قطعی.
