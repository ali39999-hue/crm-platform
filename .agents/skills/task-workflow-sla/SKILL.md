---
name: task-workflow-sla
description: طراحی Task transition، dependency و SLA.
---

# Skill: task-workflow-sla

## هدف
طراحی Task transition، dependency و SLA.

## ورودی‌های لازم
- مسئله/issue و معیار پذیرش
- فایل‌ها و ماژول‌های مرتبط
- قرارداد API و permission matrix مرتبط
- محدودیت‌ها، ریسک‌ها و تصمیم‌های ADR

## مراحل اجرا
1. transitionهای معتبر را explicit نگه دار.
2. cycle check گراف dependency را انجام بده.
3. optimistic concurrency و reopening policy را تعریف کن.
4. business calendar و pause rule SLA را مشخص کن.
5. duplicate worker/escalation را مهار کن.

## خروجی اجباری
الگوریتم با تست مرزی timezone/calendar/graph.

## چک‌لیست پایان
- [ ] فایل‌ها و فرضیات بررسی‌شده گزارش شده‌اند.
- [ ] هیچ تست اجرا‌نشده به‌عنوان سبز اعلام نشده است.
- [ ] امنیت، مجوزها و حالت‌های خطا لحاظ شده‌اند.
- [ ] مستندات و backlog در صورت نیاز به‌روز شده‌اند.
- [ ] ریسک باقی‌مانده، owner و اقدام بعدی ثبت شده‌اند.

## محدودیت ایمنی
- secret واقعی را نخوان، چاپ یا commit نکن.
- داده production را تغییر نده و هیچ deploy/push بدون تأیید انسانی انجام نده.
- قبل از اقتباس کد خارجی، نسخه و license را بررسی کن.
- اگر دامنه یا evidence کافی نیست، عدم قطعیت را واضح گزارش بده؛ نتیجه را جعل نکن.
