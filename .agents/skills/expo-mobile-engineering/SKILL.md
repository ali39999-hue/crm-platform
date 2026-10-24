---
name: expo-mobile-engineering
description: ساخت تجربه موبایل امن و قابل اتکا.
---

# Skill: expo-mobile-engineering

## هدف
ساخت تجربه موبایل امن و قابل اتکا.

## ورودی‌های لازم
- مسئله/issue و معیار پذیرش
- فایل‌ها و ماژول‌های مرتبط
- قرارداد API و permission matrix مرتبط
- محدودیت‌ها، ریسک‌ها و تصمیم‌های ADR

## مراحل اجرا
1. secure storage را برای secretها به‌کار ببر.
2. API client و error handling را یکپارچه کن.
3. deep link را بعد از auth دوباره authorize/fetch کن.
4. network retry را idempotent کن.
5. lifecycle، safe area، accessibility و crash را تست کن.

## خروجی اجباری
deep-link/session/notification/offline checklist و تست دستگاه.

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
