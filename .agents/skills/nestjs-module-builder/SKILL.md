---
name: nestjs-module-builder
description: ساخت use case در ماژول NestJS با مرز مشخص.
---

# Skill: nestjs-module-builder

## هدف
ساخت use case در ماژول NestJS با مرز مشخص.

## ورودی‌های لازم
- مسئله/issue و معیار پذیرش
- فایل‌ها و ماژول‌های مرتبط
- قرارداد API و permission matrix مرتبط
- محدودیت‌ها، ریسک‌ها و تصمیم‌های ADR

## مراحل اجرا
1. مالکیت دامنه و قرارداد را مشخص کن.
2. DTO با validation allowlist اضافه کن.
3. authorization را قبل از access/mutation اجرا کن.
4. transaction و audit/outbox مورد نیاز را پیاده کن.
5. unit/integration و OpenAPI را به‌روز کن.

## خروجی اجباری
controller/use-case/domain adapter و تست‌ها.

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
