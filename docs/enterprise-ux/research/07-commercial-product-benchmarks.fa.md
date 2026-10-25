# بنچمارک محصولات تجاری: دیدار و Jira

**تاریخ مراجعه به صفحات عمومی:** 2026-10-24. این سند، برنامه ارزیابی UX/feature است؛ آزمون کامل داخل حساب کاربری یا بررسی تمام مسیرهای محصول انجام نشده است.

## دیدار CRM — مرجع CRM فارسی و فروش

- صفحه رسمی: https://didar.me/
- ویژگی‌ها: https://didar.me/didar-crm-features/
- راهنمای استفاده/آموزش: https://didar.me/learn-didar/
- اپ موبایل: https://didar.me/mobile-app/
- پشتیبانی: https://didar.me/support/

صفحات عمومی دیدار بر CRM ابری، مدیریت مشتری و سرنخ، کاریز/فرآیند فروش، پیگیری‌ها، یکپارچگی ابزارها، سطوح دسترسی، داشبورد و موبایل تأکید می‌کنند. موارد زیر را در بازبینی مجاز محصول/دمو ارزیابی کنید:

1. کاربر فروش در ۳۰ ثانیه چگونه مشتری یا سرنخ را پیدا و ثبت می‌کند؟
2. فعالیت بعدی و یادآوری چگونه کنار رکورد مشتری دیده می‌شود؟
3. کاریز فروش، تغییر مرحله و مسئول هر فرصت چقدر قابل فهم است؟
4. صفحات در فارسی RTL، تاریخ/عدد ایرانی و نمایشگر موبایل چگونه عمل می‌کنند؟
5. واردکردن داده، اتصال ابزارها، permission و گزارش فروش در چه سطحی قابل مشاهده/پیکربندی‌اند؟

**تصمیم طراحی برای CRM ما:** سادگی و فروش‌محوری را benchmark کن؛ نه لزوماً چیدمان یا رنگ را. مسیر اصلی کار فروش، ثبت تماس/پیگیری و ادامه کار از My Work باید کوتاه و یکدست باشد. ویژگی‌های اعلام‌شده در وب‌سایت به‌خودی‌خود اثبات نمی‌کنند هر رفتار در تمام پلن‌ها یا نقش‌ها در دسترس است.

## Jira Cloud — مرجع مدیریت کار و workflow

- محصول: https://www.atlassian.com/software/jira
- الگوهای رسمی: https://www.atlassian.com/software/jira/templates
- مستندات templateها/spaceها: https://support.atlassian.com/jira-software-cloud/docs/what-are-the-project-templates/
- Scrum/Kanban planning: https://support.atlassian.com/jira-software-cloud/docs/create-and-plan-work-with-scrum-and-kanban/
- Board configuration: https://support.atlassian.com/jira-cloud-administration/docs/configure-boards/
- Create work item & subtask: https://support.atlassian.com/jira-software-cloud/docs/create-a-work-item-and-a-subtask/

Jira برای board، backlog، sprint، bug tracking، workflow، parent/child work items و command-based creation یک مرجع ارزیابی است. در walkthrough، این موارد را ثبت کنید:

1. آیا کاربر می‌فهمد کدام space/project و filter را مشاهده می‌کند؟
2. ساخت item از global create در برابر inline create چه تفاوتی در required fields و context دارد؟
3. drag/drop، ranking، keyboard access و transition rule چگونه با هم سازگارند؟
4. board، backlog، timeline/roadmap و گزارش‌ها چگونه به یک model واحد وصل‌اند؟
5. permissionها در تنظیمات، inline actions و linkهای مستقیم چگونه enforced و آشکار می‌شوند؟

**تصمیم طراحی برای CRM ما:** patternهای task lifecycle، backlog، keyboard command و workflow configuration را اقتباس کن؛ پیچیدگی Jira را برای کاربر sales/support عیناً وارد نکن. برای تیم‌هایی که نیاز ندارند، progressive disclosure و default ساده در نظر بگیر.

## Open-source implementation references
برای اینکه رفتارها به کد قابل بررسی هم وصل شود، از Twenty، Frappe CRM، Plane، OpenProject، Chatwoot، TanStack Table/Query و Storybook استفاده کنید. فهرست کامل در `research/01-references.csv` است. برای هر منبع، branch/tag، license و commit مربوط به pattern مورد بررسی را ثبت کنید.

## محدودیت حقوقی و روش کار
این صفحات به‌عنوان منابع عمومی benchmark استفاده می‌شوند؛ دسترسی محدود/حساب کاربری را دور نزنید، rate limit را bypass نکنید، asset/متن/کد را بدون مجوز بازاستفاده نکنید. اگر محصول demo account عمومی دارد، فقط طبق شرایط همان demo بررسی کنید. اسکرین‌شات‌ها را برای تحلیل داخلی حداقلی نگه دارید و از اطلاعات مشتری/PII استفاده نکنید.
