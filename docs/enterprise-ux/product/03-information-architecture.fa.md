# معماری اطلاعات و ناوبری

## ماژول‌های سطح اول
1. **Home / My Work:** assigned, due soon, overdue, mentions و saved views.
2. **CRM:** Leads، Contacts، Accounts، Deals/Pipelines، Activities.
3. **Support:** Inbox، Tickets، Customers، SLA، Knowledge Base.
4. **Work:** Projects، Tasks/Issues، Boards، Cycles، Roadmaps، Calendar.
5. **Collaboration:** Docs، Files، Comments، Mentions.
6. **Insights:** Dashboards، Reports، Forecast، SLA/Workload.
7. **Automation:** Workflows، runs، rules و triggers.
8. **Admin:** workspace، members، teams، roles، fields، integrations، audit و security.

Customer Portal shell مستقل و کوچک خودش را دارد.

## Shell
- Sidebar: گروه‌های ثابت، collapse، active state واضح.
- Top bar: workspace selector، global search/command، create، notifications، help/profile.
- Content header: breadcrumb واقعی، title، primary action، overflow.
- View toolbar: local search، filter، sort، group، view, columns و save view.
- Main: table/board/timeline/calendar/detail.
- Detail drawer برای مرور سریع؛ page عادی برای deep link و جریان طولانی.

## قواعد
- هر route یک title و primary action واحد.
- destructive action جدا با confirmation.
- active nav فقط روی route match دقیق.
- نمایش ماژول بر اساس capability/config اما مجوز واقعی در API.
- workspace slug در URL برای deep link است؛ از URL به‌تنهایی tenant trust نشود.
- filters/sort/group/page در URL state؛ query باید server-side validate شود.
- تغییر route نباید بی‌هشدار draft مهم را از بین ببرد.

## Mobile
Desktop sidebar؛ tablet mini rail/overlay؛ mobile bottom navigation برای ۴–۵ مقصد + More drawer. جدول عریض به compact list/card تبدیل شود نه کوچک‌سازی غیرقابل استفاده.
