# خلاصه محصول و PRD اولیه

## چشم‌انداز
فضای کاری یکپارچه برای مدیریت چرخه مشتری و عملیات کارکنان؛ از سرنخ و تعامل تا task، پروژه، تیکت، گزارش و audit.

## نقش‌های اصلی
System Owner، Organization Admin، Manager، Employee، Sales، Support Agent، Customer Portal User، Auditor و Integration Account.

## اهداف MVP
1. ورود امن و عضویت سازمانی.
2. داشبورد «کارهای من»، task/project، کامنت و تاریخچه.
3. CRM پایه: Account، Contact، Lead و Deal.
4. تیکت پشتیبانی با پیام داخلی/مشتری و audit.
5. اعلان in-app و ایمیل از طریق worker؛ تحویل idempotent و قابل retry.
6. جست‌وجوی محدود به مجوز، فایل با لینک موقت و log دسترسی حساس.
7. وب واکنش‌گرا و اپ موبایل برای مشاهده/به‌روزرسانی مسیرهای پرتکرار.

## خارج از محدوده MVP
Workflow builder عمومی، microservices متعدد، agent هوش مصنوعی با مجوز گسترده، BI آزاد، offline full sync، marketplace، custom objects نامحدود.

## معیارهای پذیرش محصول
- مشتری هرگز یادداشت داخلی یا task داخلی را از API، search، file، export یا push notification مشاهده نمی‌کند.
- همه تغییرات حساس actor، زمان، موجودیت، requestId و نتیجه را ثبت می‌کنند.
- چرخه‌های task و ticket با قواعد سرور انجام و در تست منفی پوشش داده می‌شوند.
- اعداد داشبورد یا از داده واقعی می‌آیند یا به‌وضوح placeholder هستند؛ KPI ساختگی ممنوع.
- صفحه‌های کلیدی وب و موبایل حالت loading، empty، error، no permission و offline/reconnect تعریف‌شده دارند.

## فرضیات موقت
- تک‌شرکتی در فاز اول، اما با organization scope از ابتدا.
- API واحد برای وب و موبایل.
- پشتیبانی از فارسی/RTL و انگلیسی/LTR از آغاز ساخت UI، حتی اگر همه ترجمه‌ها در MVP کامل نباشند.
- تصمیم نهایی identity provider و کانال‌های ارتباطی در Discovery گرفته می‌شود.

## پرسش‌های Discovery
تعداد کاربران و حجم داده؛ ابزارهای مبدا برای مهاجرت؛ نیاز SSO/MFA؛ سیاست نگهداری PII؛ کانال‌های پشتیبانی؛ timezone/تقویم؛ میزبانی و مسئول on-call؛ نیاز offline؛ گزارش‌های اجباری مدیریتی.
