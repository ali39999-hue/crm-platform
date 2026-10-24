---
name: api-contract-review
description: بازبینی API قراردادمحور و سازگاری مشتری‌ها.
---

# Skill: api-contract-review

## هدف
بازبینی API قراردادمحور و سازگاری مشتری‌ها.

## ورودی‌های لازم
- مسئله/issue و معیار پذیرش
- فایل‌ها و ماژول‌های مرتبط
- قرارداد API و permission matrix مرتبط
- محدودیت‌ها، ریسک‌ها و تصمیم‌های ADR

## مراحل اجرا
1. route، method و error semantics را بررسی کن.
2. pagination/filter/sort را محدود و مستند کن.
3. idempotency/concurrency را برای mutationهای لازم بسنج.
4. security scheme و scope را بررسی کن.
5. OpenAPI و contract test را هماهنگ کن.

## خروجی اجباری
contract checklist و breaking-change report.

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
