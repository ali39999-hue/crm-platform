---
name: observability-sre
description: تعریف telemetry، SLO و runbook بر اساس failure mode.
---

# Skill: observability-sre

## هدف
تعریف telemetry، SLO و runbook بر اساس failure mode.

## ورودی‌های لازم
- مسئله/issue و معیار پذیرش
- فایل‌ها و ماژول‌های مرتبط
- قرارداد API و permission matrix مرتبط
- محدودیت‌ها، ریسک‌ها و تصمیم‌های ADR

## مراحل اجرا
1. کاربر/اثر business را به سیگنال مرتبط کن.
2. requestId/traceId را در مسیر حفظ کن.
3. PII و secret را از logs حذف کن.
4. alert مبتنی بر SLO و اقدام مشخص بساز.
5. backup/restore و incident recovery را تمرین کن.

## خروجی اجباری
metrics/logs/traces، alert rule و incident runbook.

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
