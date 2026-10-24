# مشخصات اپ موبایل

## هدف
اپلیکیشن برای اقدام‌های پرتکرار کارکنان و تعامل‌های لازم مشتری؛ نه کپی یک‌به‌یک داشبورد دسکتاپ.

## MVP
- ورود و خروج امن، انتخاب workspace در صورت نیاز.
- My Work، task detail و update وضعیت/اولویت/مهلت.
- جست‌وجوی محدود CRM و مشاهده customer 360 در scope مجاز.
- مشاهده و پاسخ به ticket بر مبنای visibility و permission.
- notification center و deep link امن.
- profile، تنظیمات locale/timezone و مدیریت session.

## امنیت دستگاه
- token/session در secure storage سیستم‌عامل؛ AsyncStorage برای secret ممنوع.
- push فقط شناسه/نوع خنثی ارسال کند؛ قبل از نمایش جزئیات، اپ باید مجوز و داده را از API دوباره بگیرد.
- logout، revoke session، device loss و refresh token rotation باید طراحی شوند.
- PII در log، crash report و clipboard ناخواسته ثبت نشود.

## آفلاین
نسخه اول: cache محدود برای داده‌های غیرحساس مجاز و draft محلی. هرگونه mutation queue آفلاین باید conflict policy، idempotency، expiry و reauthorization هنگام sync داشته باشد. «آخرین نوشتن برنده است» برای task/CRM پیش‌فرض مناسبی نیست.

## کیفیت
- تست روی iOS و Android واقعی یا emulator معتبر.
- foreground/background، قطع/وصل شبکه، token expiry، push tap، deep link، keyboard، safe areas و dynamic type.
- بررسی نسخه SDK و native dependencies با `npx expo install --fix` پس از scaffold/upgrades.
- سنجش startup، crash-free session، API error و battery/network impact.
