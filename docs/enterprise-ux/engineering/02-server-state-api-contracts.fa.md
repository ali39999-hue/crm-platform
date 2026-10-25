# قرارداد API و state سرور

## الگوی response
موفقیت‌ها shape پایدار و مستند داشته باشند؛ فهرست‌ها `{ data, pagination }` یا envelope موجود پروژه را یک‌دست مصرف کنند. خطاها حداقل `code`, `message`, `requestId`, `details?` داشته باشند؛ stack و PII به client نرود. اگر قرارداد فعلی متفاوت است، ADR ایجاد و migration نسخه‌دار تعریف شود؛ همه‌چیز را بی‌اجازه rewrite نکن.

## فهرست و جست‌وجو
- cursor pagination برای collectionهای بزرگ؛ page pagination فقط جایی که UX/محاسبه page count نیاز دارد.
- filters/sort/search در query پارس و server-side validate شود.
- response دارای `hasMore`/cursor یا metadata معتبر باشد؛ UI از `array.length` برای حدس pagination استفاده نکند.
- field allow-list برای sort و filter؛ query string به SQL/ORM raw وصل نشود.
- empty list، no-results، restricted results و server failure از هم متمایز باشند.

## عملیات
Create/update/delete، bulk action، import/export و workflow transition باید permission، validation، transaction و audit موردنیازشان را سمت سرور داشته باشند. optimistic UI تنها برای عملیات قابل rollback؛ در failure، state reconcile و پیام قابل اقدام.

## قرارداد query client
- canonical key؛ بدون cache sharing اشتباه میان workspaceها.
- stale/retry policy مطابق نوع داده؛ retry خودکار برای mutation غیر idempotent ممنوع.
- cancellation هنگام route/search تغییرکرده.
- invalidation دقیق پس از mutation.
- session expiry: حفظ draft امن در حد ممکن، نمایش پیام و redirect بدون loop.

## OpenAPI
`docs/openapi.yaml` مرجع endpointهای واقعی است، نه wish-list. هر endpoint جدید باید schema/request/response/error/auth/tenant/tests را همزمان به‌روزرسانی کند. CI باید drift قابل تشخیص را fail کند. نمونه‌های OpenAPI با اجرای واقعی یا contract test هماهنگ باشند.
