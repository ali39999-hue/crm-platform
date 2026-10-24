# مهاجرت داده و ورود اطلاعات

## مسیر پیشنهادی
1. فهرست منبع‌ها و مالک داده را ثبت کنید.
2. schema mapping بین مبدا و CRM طراحی کنید.
3. sample anonymized وارد staging شود.
4. normalization ایمیل/تلفن و timezone؛ dedupe با confidence score و review انسانی.
5. dry run با تعداد ردیف و error report؛ هیچ رکورد نامعتبر بی‌صدا حذف نشود.
6. import را با batch و checkpoint انجام دهید؛ هر batch id و آمار موفق/ناموفق داشته باشد.
7. reconciliation: count، relation integrity، totals و نمونه‌گیری رکوردی.
8. برنامه cutover، freeze/CDC در صورت نیاز، rollback و ownership نهایی مشخص شود.

## قوانینی که باید رعایت شود
- source id را در جدول mapping نگه دارید تا عملیات retry idempotent شود.
- owner/status/createdAt مبدا را فقط با mapping صریح وارد کنید.
- ادغام duplicate نباید audit یا روابط رکوردها را از بین ببرد.
- attachmentها با checksum، نوع فایل، owner و visibility مهاجرت کنند.
- داده حساس در log گزارش import نباشد.
- export کامل دارای permission، rate limit و audit است.
