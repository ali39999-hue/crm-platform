# مشخصات UI/UX و Design System

## اصول
1. ابتدا کار اصلی هر نقش؛ داشبورد تزئینی قبل از workflow واقعی نسازید.
2. ناوبری کم‌عمق، عنوان واضح، breadcrumb برای جزئیات، action اصلی واحد.
3. جدول/برد/تقویم باید viewهای یک داده باشند، نه پیاده‌سازی جداگانه با منطق ناسازگار.
4. همه صفحه‌ها stateهای loading، empty، error، partial failure، disabled، success و no permission داشته باشند.
5. RTL/LTR باید با propertyهای منطقی CSS، direction و locale واقعی پیاده شود؛ برعکس کردن کل layout به‌تنهایی کافی نیست.
6. دسترس‌پذیری: keyboard، focus، semantic controls، contrast، labels، reduced motion و screen reader.
7. Mobile-first برای کارهای کوتاه و سریع؛ bulk operations و تنظیمات پیچیده در وب.

## Information architecture وب
- Home / My Work
- Work: Tasks، Projects، Boards، Calendar، Workload
- CRM: Accounts، Contacts، Leads، Deals، Activities
- Support: Inbox، Tickets، SLA، Macros
- Collaboration: Comments، Mentions، Knowledge
- Reports: Saved Reports، Dashboards، Exports
- Admin: Members، Teams، Roles، Workflows، Integrations، Audit

## الگوی صفحات مهم
### My Work
فیلترهای قابل ذخیره، taskهای امروز/عقب‌افتاده/منتظر دیگران، inline update با optimistic concurrency و undo در موارد امن.
### Customer 360
header حساب، مالک، وضعیت و next action؛ summary؛ contacts؛ deals؛ tickets؛ timeline. هر card محدودیت نمایش و permission مستقل داشته باشد.
### Task detail
عنوان قابل ویرایش با حفظ focus؛ وضعیت/priority/assignee/due date؛ description؛ dependencies؛ comments با visibility مشخص؛ activity history؛ attachment permission.
### Ticket inbox
queue و فیلتر سمت چپ در دسکتاپ؛ لیست/جزئیات responsive؛ متن پاسخ مشتری و note داخلی در controlهای متفاوت و بصری واضح.
### موبایل
Bottom navigation برای 3–5 مقصد پرتکرار؛ detail به‌صورت stack؛ actionهای فوری در thumb zone؛ فرم‌ها با input type مناسب؛ push notification نباید محتوای حساس را روی lock screen افشا کند.

## Component inventory
Button، IconButton، TextField، Select، Combobox، DatePicker، UserPicker، StatusBadge، AvatarStack، DataTable، BoardColumn، TaskCard، EmptyState، ErrorState، Skeleton، Toast، Dialog، Drawer/Sheet، Command Search، FilterBar، Breadcrumb، Timeline、Pagination、PermissionGate (صرفاً UI) و ConfirmationDialog.

## توکن‌ها
مرجع اولیه در `packages/design-tokens/tokens.json`. رنگ وضعیت فقط با رنگ بیان نشود؛ label/icon هم لازم است. اندازه‌ها را با token استفاده کنید؛ magic number در صفحات جدید ثبت نشود.

## پذیرش بصری
- 360px موبایل، تبلت و دسکتاپ؛ بدون overflow افقی ناخواسته.
- keyboard-only navigation و visible focus.
- فرم خطا را نزدیک فیلد، با پیام قابل اصلاح نشان دهد.
- modal/drawer trap focus داشته باشد و با Escape/close button بسته شود.
- loading اسکلت متناسب؛ empty state دارای راهکار بعدی؛ error state دارای retry امن.
- عملکرد موبایل در شبکه کند بررسی شود؛ auto-refetch نباید duplicate mutation تولید کند.
