---
name: authorization-threat-model
description: تهدیدسنجی و تست سیاست دسترسی.
---

# Skill: authorization-threat-model

## هدف
تهدیدسنجی و تست سیاست دسترسی.

## ورودی‌های لازم
- مسئله/issue و معیار پذیرش
- فایل‌ها و ماژول‌های مرتبط
- قرارداد API و permission matrix مرتبط
- محدودیت‌ها، ریسک‌ها و تصمیم‌های ADR

## مراحل اجرا
1. actor، resource، action و scope را تعیین کن.
2. BOLA/IDOR و cross-org را برای همه مسیرها بررسی کن.
3. search/count/export/file/notification را شامل کن.
4. مشتری و کارمند را با fixtureهای جدا تست کن.
5. یافته‌ها را با شدت، evidence و remediation ثبت کن.

## خروجی اجباری
permission matrix، abuse cases و security regression tests.

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
