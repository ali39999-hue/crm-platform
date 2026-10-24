# Architectural Decision Records (ADR)

## ADR-0001: Modular Monolith برای شروع
- **Status:** Proposed
- **Context:** دامنه CRM/work/support به هم پیوسته است و تیم هنوز مرز عملیاتی سرویس‌ها را اثبات نکرده.
- **Decision:** یک API با ماژول‌های دامنه، قرارداد داخلی و ownership مشخص.
- **Consequences:** deploy ساده‌تر؛ نیازمند انضباط مرز ماژول‌ها و تست integration.
- **Revisit when:** throughput، team ownership، fault isolation یا release cadence نیاز واقعی را ثابت کند.

## ADR-0002: PostgreSQL منبع حقیقت
- **Status:** Proposed
- **Decision:** داده تراکنشی و relationهای اصلی در PostgreSQL؛ cache/search index قابل بازسازی‌اند.
- **Consequences:** migration و query performance باید مالک و تست داشته باشند.

## ADR-0003: وب و موبایل از API قراردادی استفاده کنند
- **Status:** Proposed
- **Decision:** UIها به دیتابیس متصل نشوند؛ OpenAPI و client type-safe در CI کنترل شود.
- **Consequences:** API versioning و error semantics مهم است.

## ADR-0004: Prisma 7 در قالب اولیه
- **Status:** Proposed
- **Decision:** استفاده از نسخه GA تا زمانی که major بعدی GA و ecosystem compatibility تأیید شود.
- **Consequences:** Prisma 7 به driver adapter و `prisma.config.ts` نیاز دارد؛ پیکربندی فعلی template براساس همین مدل است.

## ثبت تصمیم‌های بعدی
برای هر ADR: Context، Drivers، Options، Decision، Consequences، Security impact، Owner، Date و Revisit trigger ثبت شود.
