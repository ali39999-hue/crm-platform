# معماری Frontend — قرارداد اجرا

## اصول
- App Router و الگوهای موجود مخزن را حفظ کن؛ قبل از ساخت abstraction جدید، `apps/web` و packageهای موجود را بخوان.
- Server Component برای data/secure composition؛ Client Component فقط برای تعامل لازم. مرز client نباید credential یا داده غیرمجاز را افشا کند.
- هر feature owner مشخص داشته باشد: `features/<feature>/{components,hooks,api,schemas,tests}` یا الگوی فعلی monorepo. ساختار دوم موازی ایجاد نکن.
- UI نباید منبع حقیقت business state باشد. state محلی فقط برای draft، open/close، selection موقت یا optimistic state با rollback.
- API client یکپارچه: typed request، abort، correlation ID، error mapping و telemetry. fetch پراکنده با قراردادهای متفاوت ممنوع.
- فرمت‌های server-side validation با frontend schema هماهنگ؛ frontend validation جای backend authorization/validation نیست.

## Feature vertical slice
1. Route و role دسترسی را مشخص کن.
2. schema ورودی/خروجی و empty/loading/error/success states را تعریف کن.
3. API service typed و query/mutation بساز.
4. componentها و keyboard behavior را پیاده کن.
5. unit/component test + E2E مسیر اصلی و negative case را اضافه کن.
6. telemetry و screenshot/QA evidence ثبت کن.

## Data fetching
از الگوی استاندارد موجود در پروژه استفاده کن. query key شامل workspace و filterها باشد؛ query cache نباید بین tenantها یا sessionهای کاربری نشت کند. هنگام logout، تغییر tenant یا privilege، query cache حساس invalidate/clear شود. mutation باید idempotency strategy را در endpointهای حساس رعایت کند.

## ممنوعیت‌های کیفیت
- دکمه‌ای که فقط toast موفقیت نشان دهد.
- لینک placeholder به `#` برای مسیر کاری.
- mock data پنهان در production path.
- broad `catch` که خطا را به موفقیت تبدیل کند.
- route یا permission چک‌شده فقط در client.
- تغییر theme سراسری به‌صورت ناخواسته؛ از tokenهای توافق‌شده استفاده شود.
