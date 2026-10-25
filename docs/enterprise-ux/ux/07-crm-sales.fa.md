# UX مشخصات: CRM، فروش و نمای 360 مشتری

## Entities
`Lead`, `Account`, `Contact`, `Deal`, `Pipeline`, `PipelineStage`, `Activity`, `Task`, `Note`, `Tag`, `Attachment`, `Relationship`, `AuditEvent`.

## List views
هر list شامل search، filter builder، sort، saved views، column visibility، pagination، selection و row actions. فیلترهای ترکیبی باید واضح باشند؛ قابلیت OR پیشرفته تا وقتی UX مناسب ندارد در P1/P2 بماند.

## Record detail template
- Header: نام/شناسه، status، owner، primary action و overflow.
- Summary strip برای فیلدهای پرتکرار.
- Sections: Overview، Activity/Timeline، Related records، Files، Notes؛ فقط با مجوز.
- Side panel: relationship، next action و audit summary.
- field edit affordance و permission واضح.

## Leads
Source، qualification، owner، lifecycle, last touch, next action. Convert flow باید duplicate matching و preview رکوردهای ساخته‌شونده داشته باشد. disqualify reason قابل گزارش باشد؛ حذف جایگزین آن نشود.

## Accounts / Contacts
Account شرکت/سازمان؛ Contact شخص با رابطه‌های تعریف‌شده. duplicate merge فقط با permission، audit و preview اثر؛ timeline مشتری همه رکوردهای مرتبط مجاز را یکجا نشان می‌دهد.

## Deals / Pipeline
- board columnها از pipeline config واقعی.
- drag/drop فقط برای transition مجاز؛ در server reject کارت rollback و دلیل نمایش داده شود.
- amount/currency/close date/stage/owner/forecast/next step تعریف روشن.
- pipeline totals با filter و scope سازگار.
- stage change + automation + audit با transaction/outbox هماهنگ.

## Acceptance
CRUD واقعی و validation سمت سرور؛ tenant isolation برای list/search/detail/relations/files/export؛ duplicate/retry/conflict tests؛ E2E lead-to-deal.
