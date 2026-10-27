# ماتریس جامع انطباق و بنچ‌مارک ۱۰۰٪ ماژول‌ها و فیچرهای میزیتو (Mizito)

این سند مرجع فنی و ماتریس تحلیل تمامی ماژول‌ها، قابلیت‌ها، منطق‌های رفتاری و جریان‌های کاری پلتفرم **میزیتو (Mizito.ir)** است که در سامانه یکپارچه سازمانی CRM ما پیاده‌سازی و تطبیق داده شده است.

---

## ۱. فهرست کلان زیرسیستم‌ها و ابزارهای میزیتو

| ردیف | نام ماژول در میزیتو | شناسه فنی پلتفرم ما | شرح و کاربرد سازمانی | شواهد کد و تست (Code & Test Evidence) | وضعیت پیاده‌سازی |
|---|---|---|---|---|---|
| ۱ | **کارتابل نامه‌ها و مکاتبات اداری** | `letters` / `office_automation` | ثبت نامه‌های وارده، صادره و داخلی با شماره اندیکاتور یکتا | `LettersService.ts`, `OfficeLettersView.tsx` | پیاده‌سازی‌شده (Production-Ready) |
| ۲ | **گردش و ارجاع نامه** | `letter_referrals` | ارجاع نامه به همکاران همراه با دستور اقدام و تعیین مهلت | `LettersController.referLetter`, `OfficeLettersView` | پیاده‌سازی‌شده (Production-Ready) |
| ۳ | **پاراف نامه‌ها و منطق قفل دیده‌شدن** | `letter_paraffs` | ثبت پاراف رسمی روی نامه با قابلیت حذف فقط قبل از رویت گیرنده | `canDeleteParaff`, `mizito.spec.ts` | پیاده‌سازی‌شده (Production-Ready) |
| ۴ | **دبیرخانه و شماره اندیکاتور** | `secretariat_indicator` | شماره‌گذاری خودکار بر اساس سال، واحد سازمانی و فرمت رسمی | `generateIndicatorNumber`, `letters.spec.ts` | پیاده‌سازی‌شده (Production-Ready) |
| ۵ | **صورتجلسات سازمانی دیجیتال** | `meeting_minutes` | ثبت نشست‌ها، حاضرین، غایبین و میهمانان خارج از سازمان | `MeetingsService.ts`, `MeetingMinutesView.tsx` | پیاده‌سازی‌شده (Production-Ready) |
| ۶ | **مصوبات جلسه و ارجاع به کارتابل** | `meeting_resolutions` | تبدیل مصوبه به وظیفه مستقیم برای اعضا با سررسید مشخص | `convertResolutionToTask`, `meetings.spec.ts` | پیاده‌سازی‌شده (Production-Ready) |
| ۷ | **امضای دیجیتال صورتجلسه** | `meeting_signatures` | فرآیند تایید و امضای رسمی شرکت‌کنندگان در صورتجلسه | `MeetingsService.signMeeting`, `meetings.spec.ts` | پیاده‌سازی‌شده (Production-Ready) |
| ۸ | **وزن وظیفه (Task Weight)** | `task_weight` | ضریب اهمیت ۱ تا ۵ برای محاسبه درصد پیشرفت واقعی پروژه | `calculateWeightedProjectProgress`, `mizito.ts` | پیاده‌سازی‌شده (Production-Ready) |
| ۹ | **نقش تاییدکننده وظیفه (Approver)** | `task_approver` | تفکیک انجام‌دهنده و تاییدکننده، رفتن به حالت انتظار تایید | `evaluateTaskApprovalTransition`, `mizito.spec.ts` | پیاده‌سازی‌شده (Production-Ready) |
| ۱۰ | **وظایف تکرارشونده و دوره‌ای** | `recurring_tasks` | تولید اتوماتیک کارها بر اساس روزهای هفته، ماه یا الگوهای تکرار | `AutomationService.ts`, `JobWorkerService.ts` | پیاده‌سازی‌شده (Production-Ready) |
| ۱۱ | **محاسبه پیشرفت وزنی پروژه** | `weighted_progress` | محاسبه فرمول `∑(وزن × درصد) / ∑وزن` به جای میانگین ساده | `calculateWeightedProjectProgress`, `mizito.spec.ts` | پیاده‌سازی‌شده (Production-Ready) |
| ۱۲ | **وابستگی و گانت چارت وظایف** | `task_dependencies` | روابط پیش‌نیازی (BlockedBy / Blocks) در تقویم و گانت | `calculateGanttSchedule`, `gantt.spec.ts`, `GanttChartView.tsx` | پیاده‌سازی‌شده (Production-Ready) |
| ۱۳ | **مانیتورینگ پنج‌گانه سازمانی** | `executive_monitoring` | داشبورد رصد ۵ محور: پروژه‌ها، پرسنل، وظایف، جلسات، مالی | `calculate5AxisMonitoring`, `ExecutiveMonitoringView.tsx` | پیاده‌سازی‌شده (Production-Ready) |
| ۱۴ | **مانیتورینگ معوقات مالی** | `financial_arrears_monitor` | رصد مطالبات و اسناد وصول‌نشده دارای سررسید گذشته | `ReportingService.getExecutive5AxisMonitoring` | پیاده‌سازی‌شده (Production-Ready) |
| ۱۵ | **پرونده مشتری و اسناد مالی** | `mizito_customer_dossier` | الحاق تاریخچه فاکتورها، صورتجلسات و وظایف به مشتری ۳۶۰ | `Customer360Drawer.tsx`, `CrmService.ts` | پیاده‌سازی‌شده (Production-Ready) |
| ۱۶ | **ثبت کارکرد و گزارش کار وظیفه** | `task_work_reports` | گزارش‌دهی متنی و عددی پیشرفت به همراه الصاق فایل و زمان | `TimeTrackingService.ts`, `TimeTrackingView.tsx` | پیاده‌سازی‌شده (Production-Ready) |
| ۱۷ | **الگوهای وظیفه (Task Templates)** | `task_templates` | ساخت سریع کارهای تکراری بر اساس قالب استاندارد از پیش تعریف‌شده | `ProjectsView.tsx`, `CreateTaskModal.tsx` | پیاده‌سازی‌شده (Production-Ready) |
| ۱۸ | **گفتگوی تیمی و کانال‌های اطلاع‌رسانی** | `team_chat_channels` | پیام‌رسان درون‌برنامه‌ای، پیام صوتی، منشن و نظرسنجی تیمی | `MentionService.ts`, `MentionsInboxView.tsx` | پیاده‌سازی‌شده (Production-Ready) |
| ۱۹ | **تقویم جامع شمسی و مهلت‌ها** | `jalali_deadlines_calendar` | پایش وظایف بر مبنای مهلت انجام با شمارنده روزانه در تقویم | `ActivityService.ts`, `JalaliActivityCalendarView.tsx` | پیاده‌سازی‌شده (Production-Ready) |
| ۲۰ | **حریم خصوصی و سطوح دسترسی ۴گانه** | `mizito_roles_rbac` | مالک میزکار، مدیر میزکار، عضو عادی، کاربر مهمان (Guest) | `permissions.ts`, `permissions.test.ts` | پیاده‌سازی‌شده (Production-Ready) |

---

## ۲. منطق‌های رفتاری عمیق استخراج‌شده از میزیتو (Deep Behavioral Logic)

### الف. قوانین حذف نامه و پاراف (Letter & Paraff Deletion Rules)
1. **نامه کامل:** فقط فرستنده اصلی تا پیش از خوانده‌شدن نامه می‌تواند آن را حذف کند. تنها استثنا: «مدیر میزکار (Workspace Admin)» می‌تواند نامه‌ای که خودش ایجاد کرده را حتی بعد از خوانده‌شدن نیز حذف کند.
2. **پاراف:** نویسنده پاراف فقط تا پیش از خوانده‌شدن توسط مخاطب مجاز به حذف آن است؛ مدیر میزکار مجاز به حذف پاراف‌های خودش حتی بعد از رویت است.
3. **اندیکاتور دبیرخانه:** فرمت استاندارد شماره ثبت اندیکاتور: `[سال]/[کد-دبیرخانه]/[شماره-ترتیبی]` (مثال: `1405/SEC/1042`).

### ب. منطق وزن وظایف و پیشرفت پروژه (Weighted Progress Engine)
- هر وظیفه دارای یک وزن `weight` بین ۱ تا ۵ (یا ضرایب سفارشی) است.
- پیشرفت هر وظیفه `progressPercent` بین ۰ تا ۱۰۰ است.
- درصد واقعی پیشرفت فاز/پروژه حاصل تقسیم مجموع ضرب وزن در درصد هر وظیفه بر کل اوزان وظایف است:
  $$\text{Project Progress} = \frac{\sum_{i=1}^{n} (\text{weight}_i \times \text{progress}_i)}{\sum_{i=1}^{n} \text{weight}_i}$$
- اگر پروژه‌ای وظیفه‌ای نداشته باشد یا مجموع وزن‌ها ۰ باشد، درصد پیشرفت ۰ خواهد بود.

### ج. چرخه وضعیت وظایف با نقش تاییدکننده (Task Approval Lifecycle)
- فیلدهای وظیفه: `assigneeId` (انجام‌دهنده) و `approverId` (تاییدکننده اختیاری).
- اگر `approverId` تعریف شده باشد:
  - وقتی انجام‌دهنده وظیفه را تمام می‌کند، وضعیت به `COMPLETED` نمی‌رود، بلکه وارد وضعیت `AWAITING_APPROVAL` (در انتظار تایید) می‌شود.
  - تنها تاییدکننده یا مدیر سیستم می‌تواند آن را به `COMPLETED` تغییر دهد یا با ثبت گزارش بازخورد به `IN_PROGRESS` برگرداند.

### د. صورتجلسات دیجیتال و تبدیل به وظیفه (Digital Meeting Minutes & Task Conversion)
- جلسه شامل: `title`، `heldAt`، `location`، `secretaryId`، `attendees` (با فیلد `signatureStatus`: `PENDING` / `SIGNED` / `REJECTED`).
- هر مصوبه (`Resolution`) شامل: `title`، `assigneeId`، `dueAt` و `status`.
- قابلیت اکشن مستقیم: تبدیل مصوبه به یک تسک در پروژه مربوطه با تخصیص خودکار مسئول و سررسید.

### ه. مانیتورینگ ۵ محور سازمانی (5-Axis Monitoring)
- تجمیع سریع وضعیت:
  1. پروژه‌ها: فعال، راکد، تاخیردار، تکمیل‌شده
  2. اعضا: تعداد تسک‌های باز، نرخ انجام به موقع، ساعت کارکرد
  3. وظایف: در صف، در انتظار تایید، تاخیرخورده
  4. جلسات: جلسات این ماه، نرخ امضای صورتجلسات، مصوبات معوق
  5. معوقات مالی: مبالغ اسناد و چک‌های سررسیدگذشته
