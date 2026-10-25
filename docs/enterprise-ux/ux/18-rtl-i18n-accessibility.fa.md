# RTL، i18n و Accessibility

## RTL
`dir` در root و portal تعیین شود؛ از logical CSS مثل `margin-inline`, `padding-inline`, `inset-inline`, `text-align:start` استفاده شود. mixed Persian/English/URL/ID isolate شود. فقط آیکون‌های جهت‌دار در معنای واقعی mirror شوند. chart axis، breadcrumb، sort، timeline و keyboard nav جدا تست شوند.

## Locale/time
زبان، timezone، calendar و numeral preferences مستقل‌اند. storage timestamp canonical؛ date-only از datetime جدا. Currency با ISO code + locale؛ translation keys به‌جای متن hard-coded؛ pluralization ICU/کتابخانه معتبر.

## Accessibility
هدف WCAG 2.2 AA برای مسیرهای اصلی: contrast، visible focus، labels/names، keyboard operation برای dialog/combobox/table/board/command palette، error suggestions، async announcement و reduced motion، 200% zoom/reflow.

axe-core/Playwright + manual keyboard/screen reader spot check. اتوماسیون به‌تنهایی اثبات compliance نیست. هر bug با severity/route/role/repro/regression test.
