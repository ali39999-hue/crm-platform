# راهنمای ادغام بسته با مخزن فعلی

## محل پیشنهادی

ابتدا این بسته را در `docs/enterprise-ux-blueprint/` قرار بده؛ اسناد فعلی را حذف یا بی‌صدا overwrite نکن. پس از تطبیق، لینک بسته را به `README.fa.md`, `FILE_INDEX.fa.md`, `AGENTS.md` و در صورت تأیید به `ROADMAP.fa.md` اضافه کن.

## نگاشت

| بسته جدید | اسناد فعلی برای تطبیق | روش ادغام |
|---|---|---|
| `00-MASTER-PLAN.fa.md` | `ROADMAP.fa.md`, `docs/00-product-brief.fa.md` | scope conflict به decision log برود. |
| `product/*` | `docs/00-product-brief.fa.md`, `docs/flows.mmd` | journeyها و نیازمندی‌ها شناسه مشترک بگیرند. |
| `ux/*`, route inventory | `docs/04-ui-ux-spec.fa.md`, `apps/web/src/app/*` | وضعیت route فقط با evidence از کد/تست تعیین شود. |
| `engineering/*` | `docs/01-architecture.fa.md`, `02-domain-model`, `03-api-contracts` | تصمیم متعارض با ADR حل شود. |
| `engineering/05-authorization` | `docs/06-security-threat-model.fa.md`, `docs/permission-matrix.csv` | مرجع مجوز API باشد، نه visibility دکمه. |
| `quality/*` | `docs/07-testing-quality.fa.md`, `docs/08-devops-observability.fa.md` | gateها به CI متصل شوند. |
| `research/01-references.csv` | `docs/references/50-repositories.fa.md` | duplicateها ادغام؛ metadata روز اجرا با collector. |
| `execution/02-backlog.csv` | `docs/implementation-backlog.csv` | یک backlog canonical نگه‌دار و IDها را dedupe کن. |
| `scripts/*` | `docs/references/source-and-version-check.md` | collector کمک تحقیق است، نه تأیید حقوقی. |

## روال merge

1. snapshot `main` و CI ثبت شود؛ هیچ reset/force push.
2. فایل‌ها را زیر مسیر مستقل کپی کن.
3. PR مستنداتی بساز و لینک‌ها را بررسی کن.
4. ستون evidence route inventory را با source path/test واقعی پر کن.
5. backlog را به issueهای کوچک با معیار پذیرش تبدیل کن.
6. P0 security و data-backed vertical slice پیش از visual polish گسترده اجرا شوند.
7. هر vertical slice مسیر browser → API → DB → audit → test را اثبات کند.

## حفاظت

هیچ production deploy، migration مخرب، حذف داده یا تغییر secret مجاز نیست. توکن‌های پیشنهادی باید با `packages/design-tokens/tokens.json` فعلی diff شوند. `ROADMAP.fa.md` فعلی تا زمان تصمیم رسمی منبع اصلی باقی بماند.
