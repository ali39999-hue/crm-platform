---
name: crm-workflow-rules
description: تدوین قواعد Lead، Account، Contact و Deal.
---

# Skill: crm-workflow-rules

## هدف
تدوین قواعد Lead، Account، Contact و Deal.

## ورودی‌های لازم
- مسئله/issue و معیار پذیرش
- فایل‌ها و ماژول‌های مرتبط
- قرارداد API و permission matrix مرتبط
- محدودیت‌ها، ریسک‌ها و تصمیم‌های ADR

## مراحل اجرا
1. مالک و lifecycle هر رکورد را مشخص کن.
2. exact matching و fuzzy candidate را جدا کن.
3. conversion را idempotent و audit-aware طراحی کن.
4. دلیل برد/باخت و next action را استاندارد کن.
5. race condition و merge conflict را تست کن.

## خروجی اجباری
pipeline state machine، dedupe policy و conversion rules.

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
