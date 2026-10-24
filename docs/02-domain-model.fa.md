# مدل دامنه و قواعد داده

## موجودیت‌های پایه
Organization، User، Membership، Team، TeamMember، Project، Task، TaskDependency، TaskComment، Account، Contact، Lead، Deal، Ticket، TicketMessage، Activity، AuditEvent، Notification.

## شناسه و scope
- شناسه داخلی UUID؛ key قابل نمایش مثل `TASK-1042` یا `TKT-1042` جداگانه و یکتا در محدوده سازمان.
- تمام موجودیت‌های سازمانی دارای `organizationId` هستند، مگر اینکه استثنا مستند و بازبینی شده باشد.
- سرور organization فعال را از membership معتبر به‌دست می‌آورد؛ مقدار ارسالی کلاینت دلیل دسترسی نیست.
- FK به‌تنهایی tenant isolation را تضمین نمی‌کند. هنگام اتصال Task به Project، Account به Ticket و روابط مشابه، سازمان هر دو طرف باید در use case اعتبارسنجی شود؛ ترجیحاً constraint ترکیبی DB نیز اضافه شود.

## Task
- وضعیت و priority enum کنترل‌شده دارند.
- تغییر وضعیت فقط از transition مجاز؛ پایان‌یافته/لغوشده فقط با مجوز ویژه باز می‌شوند.
- `version` برای optimistic concurrency است؛ update با version قدیمی باید conflict بدهد، نه اینکه تغییر دیگری را بی‌صدا overwrite کند.
- وابستگی با گراف جهت‌دار و بدون چرخه؛ قبل از افزودن A→B بررسی شود آیا B از قبل به A وابسته است.
- visibility برای تمایز INTERNAL از CUSTOMER_SHARED است، اما به‌تنهایی policy کامل نیست؛ هر endpoint باید access policy را اعمال کند.

## CRM
- Contact ممکن است به Account متصل یا مستقل باشد؛ قواعد merge/dedup باید قابل ممیزی باشند.
- تشخیص duplicate از exact email/normalized phone شروع شود؛ fuzzy match فقط پیشنهاد ادغام بدهد، نه ادغام مخرب خودکار.
- تبدیل Lead به Account/Contact/Deal در transaction یا workflow idempotent باشد؛ عملیات retry نباید رکوردهای تکراری بسازد.
- مبلغ Deal در `amountMinor` به‌صورت integer و همراه currency نگهداری می‌شود؛ از float برای پول استفاده نکنید.

## Ticket و SLA
- پیام داخلی و قابل مشاهده برای مشتری از هم جدا؛ query مشتری باید فقط customer-visible records را برگرداند.
- محاسبه SLA بر اساس timezone سازمان، تقویم کاری، تعطیلات، pause rules و وضعیت‌های معتبر است.
- یک job تأخیرخورده نباید باعث دو پاسخ یا دوبار escalation شود؛ lock/idempotency key و audit ضروری‌اند.

## Audit و Activity
- AuditEvent تغییرات حساس را با actor، org، entity، action، زمان و requestId ثبت می‌کند.
- Audit log نباید شامل password، token، secret یا متن کامل PII غیرضروری باشد.
- Activity timeline می‌تواند تجمیع چند ماژول باشد، ولی باید policy نمایش را حفظ کند.

## یادداشت schema
`apps/api/prisma/schema.prisma` schema آغازین است و پیش از migration باید با معماری، نیازهای واقعی و محدودیت‌های relational/tenant review شود. این schema به‌تنهایی تضمین تولیدی بودن نیست.
