# UX مشخصات: Shell، ناوبری، جست‌وجوی سراسری و Command Palette

## Shell
- Sidebar با گروه‌های سطح اول، icon+label، collapse و tooltip/accessibility name.
- Topbar: workspace selector، search/command، create، notifications، help و profile.
- Content header: breadcrumb واقعی، title، primary action و overflow.
- View toolbar: local search، filter، sort، group، view selector، columns و save view.
- portal عمومی/customer shell مستقل دارد.

## Search
Global search برای entityهای مجاز از local list search تفکیک شود. نتایج گروه‌بندی‌شده با نوع رکورد، عنوان و context امن. API باید access control کند؛ فیلتر frontend کافی نیست.
- debounce اولیه 200–300ms و سپس telemetry-guided tuning.
- Ctrl/Cmd+K، Escape، arrow keys و Enter.
- query خالی: recent items فقط از workspace/session جاری.
- loading/no result/offline/error state روشن.
- deep link به detail و check مجدد permission در سرور.

## Create menu
گزینه‌ها بر اساس capability/feature flag. ایجاد تنها پس از API response موفق اعلام شود و ID رکورد داشته باشد؛ prefill از context صفحه قابل مشاهده/قابل اصلاح باشد.

## Notifications
Unread, mark-read, deep links و فیلتر assigned/mentions. sensitive content در push/email/browser title افشا نشود. read state بین sessionها synchronize شود.

## Acceptance
keyboard-only از shell به search result و back؛ URL state حفظ؛ search cross-tenant ندارد؛ تغییر workspace cache و selection را ایمن تفکیک می‌کند.
