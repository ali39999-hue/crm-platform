# UX مشخصات: Home و My Work

Home صفحه «چه کاری باید بعدی انجام دهم؟» است نه داشبورد تزئینی.

## Structure
1. Context/date/timezone محدود و قابل فهم.
2. Quick create و search.
3. My tasks: due today, overdue, upcoming؛ گروه‌بندی priority/project.
4. CRM follow-ups: deal بدون next activity، lead جدید assign شده.
5. Support: tickets assign شده یا SLA نزدیک، فقط برای نقش‌های مربوط.
6. mentions/assigned/recently viewed و saved views.

## Behavior
- هر widget title، data freshness، empty state و لینک «مشاهده همه» دارد.
- KPI بدون اقدام/تفسیر روشن اضافه نشود.
- counters از API و با timezone واحد محاسبه شوند.
- task row: title/status/priority/due/project/customer context.
- bulk operation تعداد و اثر را نمایش دهد.
- widget failure نباید کل صفحه را بشکند.
- در mobile اولویت‌ها و ترتیب widget تغییر کند؛ جدول به compact list تبدیل شود.

## Acceptance
هیچ mock KPI در production؛ independent retry؛ role-aware empty state؛ تمام CTAها به route واقعی می‌روند.
