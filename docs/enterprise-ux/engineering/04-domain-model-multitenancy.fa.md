# مدل دامنه، tenancy و lifecycle داده

## Tenant invariants
هر business record دارای `workspaceId` یا مسیر tenancy معتبر باشد. Ownership فقط با ID ارسالی از client تعیین نمی‌شود؛ principal/session و membership سرور باید tenant را تأیید کند. unique constraintها (مثلاً email/contact) باید scope صحیح داشته باشند: global، workspace یا user، بر اساس decision مستند.

## Record lifecycle
حداقل lifecycle تعریف شود: create → active/in-progress → terminal state یا archived، با actor، timestamp و دلیل transitionهای حساس. حذف نرم برای داده‌ای که audit/business continuity می‌خواهد؛ hard delete فقط با policy retention/privacy و permission ویژه. هر entity دکمه archive/delete را به شکل تصادفی بین صفحات نداشته باشد.

## Data integrity
- FK/unique/check constraintهای مهم در database؛ نه تنها در form.
- optimistic concurrency (`version` یا `updatedAt` شرطی) برای جلوگیری از overwrite خاموش.
- transaction برای multi-record changes.
- import با preview، mapping، validation، duplicate policy، dry-run، batch progress و error report.
- export با permission، expiry، scope filtering و audit؛ signed URL کوتاه‌مدت.
- merge contact/company باید reversible strategy یا confirmation واضح و audit داشته باشد.

## Retention و recovery
تعریف backup RPO/RTO؛ encryption در transit/at rest، restore drill، retention policy و data export/delete process. Backup تا وقتی restore تست نشده، مدرک recovery نیست.

## Migrations
مهاجرت expand/contract برای deployment بدون downtime؛ index/backfill روی داده بزرگ با batch و progress؛ rollback strategy، lock impact و backup قبل migration مخرب. Prisma schema تنها کافی نیست؛ migration واقعی و test از نسخه قبلی لازم است.
