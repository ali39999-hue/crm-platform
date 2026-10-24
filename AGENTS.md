# AGENTS.md — قواعد پروژه CRM

## مأموریت
ساخت یک فضای کاری یکپارچه برای CRM، مشتریان، وظایف، پروژه‌ها، پشتیبانی و همکاری کارکنان روی وب و موبایل.

## ترتیب مطالعه اجباری
1. `README.fa.md`
2. `ROADMAP.fa.md`
3. `docs/00-product-brief.fa.md`
4. `docs/01-architecture.fa.md`
5. `docs/06-security-threat-model.fa.md`
6. `docs/implementation-backlog.csv`

## قواعد توسعه
- قبل از تغییر، مسیر درخواست، مالک ماژول، مدل دامنه، مجوز و تست‌های موجود را مشخص کن.
- منطق دامنه را تا جای ممکن از UI و framework جدا نگه دار.
- API قرارداد مشخص، pagination/filter محدود و error model پایدار داشته باشد.
- احراز هویت، authorization، validation و tenant scope سمت سرور اجباری است.
- برای هر تغییر state machine، transitionهای مجاز و غیرمجاز را تست کن.
- برای job، webhook و notification، idempotency، retry محدود و dead-letter/recovery را طراحی کن.
- برای migration: اثر روی داده، زمان اجرا، index lock، rollout و recovery را مستند کن.
- حالت‌های loading، empty، error، permission denied، offline/reconnect و success در UI دیده شوند.
- در موبایل، deep link و notification فقط بعد از authorization و fetch مجدد داده را نمایش دهند.
- نام و پیوند منبع بیرونی، نسخه/tag/commit، license و هر کد اقتباس‌شده را در `docs/references/` ثبت کن.

## گزارش پایان هر تغییر
- هدف و acceptance criteria
- فایل‌های تغییریافته
- migration / API changes / permission changes
- دستورات تست واقعاً اجراشده و نتیجه واقعی
- ریسک باقی‌مانده و موارد تست‌نشده
- راه rollback یا feature flag در صورت نیاز

## ممنوع
- ادعای تست یا ممیزی که انجام نشده است.
- خواندن/چاپ secret، ارسال داده واقعی به سرویس بیرونی یا commit کردن `.env`.
- تغییر مجوزها فقط در فرانت‌اند.
- deploy، انتشار، تغییر داده production یا push به شاخه محافظت‌شده بدون اجازه صریح انسانی.
- کلون و ادغام چند محصول کامل بدون تصمیم معماری و license review.
- اضافه‌کردن microservice، AI یا ابزار جدید صرفاً به‌خاطر جذاب بودن؛ نیاز و هزینه نگهداری باید مستند باشد.

## معیار اتمام
Definition of Done در `ROADMAP.fa.md` و `docs/07-testing-quality.fa.md` را رعایت کن. تست سبز به‌تنهایی جای code review، threat review یا بررسی UX را نمی‌گیرد.
