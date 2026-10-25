# Visual QA Checklist

برای هر route با role و locale تعریف‌شده بررسی کن:

- [ ] عنوان صفحه، breadcrumb، primary action و context کار واضح است.
- [ ] hierarchy، spacing، type scale، token و icon style مطابق design system است.
- [ ] loading skeleton با ساختار واقعی صفحه تناسب دارد.
- [ ] empty state توضیح می‌دهد چرا خالی است و next action چیست.
- [ ] no-result با no-access و error تفاوت دارد.
- [ ] failure state retry، کد پیگیری یا مسیر recovery مناسب دارد.
- [ ] form labels، validation inline، focus اولین error و حفظ draft درست است.
- [ ] table: overflow، density، sorting/filtering، selected rows، sticky header و bulk action.
- [ ] dialog: focus trap، Escape، backdrop، confirm destructive action و mobile adaptation.
- [ ] detail panel: dirty state، deep link، back/forward، edit/save/cancel.
- [ ] hover، pressed، focused، disabled، selected، pending و destructive states تعریف شده.
- [ ] Persian RTL و متن انگلیسی/URL/شناسه mixed-direction درست دیده می‌شود.
- [ ] viewportهای 320، 360، 390، 768، 1024 و 1440 در صورت پشتیبانی بررسی می‌شوند.
- [ ] keyboard-only و zoom 200% بررسی می‌شود.
- [ ] screenshot مقایسه‌ای همراه PR؛ تفاوت deliberate توضیح دارد.

## Visual regression policy
Baseline فقط پس از review UX/PM به‌روز شود. انیمیشن، تاریخ، avatar تصادفی و داده غیر deterministic را پایدار کن. Screenshot test جایگزین تعامل E2E و تست دسترس‌پذیری نیست.
