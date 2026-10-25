# Responsive و تجربه موبایل

Mobile نسخه کوچک‌شده desktop نیست؛ اولویت، navigation و action bar آن فرق دارد. target لمسی حداقل 44×44 CSS px، hover-only ممنوع، table به compact card/list تبدیل شود.

## Breakpoints
از config فعلی پروژه تبعیت کن؛ اگر نیست، 640/768/1024/1280 نقطه شروع‌اند، نه قانون قطعی. تصمیم با test عرض/container است.

## Mobile core tasks
My Work؛ CRM search/open/add note/create lead؛ Support assigned queue/reply/internal note با visibility واضح؛ notifications/deep links؛ attachments upload progress/retry.

## Offline
فقط قابلیت offline پیاده‌شده اعلام شود. mutation queue نیاز به ID، timestamp، actor/session binding، state، retry/backoff، idempotency، conflict resolution، cancellation و telemetry دارد. logout queue کاربر قبلی را به بعدی منتقل نکند.

## QA
عرض 320/360/390/430، tablet/desktop، keyboard open، safe area، orientation، slow network، background/foreground و session expiry؛ screenshot موبایل در PR.
