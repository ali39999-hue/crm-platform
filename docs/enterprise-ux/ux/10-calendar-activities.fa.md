# UX مشخصات: Calendar، Activity و Follow-up

Activity می‌تواند call/meeting/email/note/reminder باشد؛ calendar event تنها شکل زمان‌دار activity نیست. یک منبع حقیقت برای date/time داشته باش.

## Calendar
- month/week/day/agenda بر اساس value واقعی.
- timezone context، all-day events، recurrence و conflict indication.
- recurrence ناقص است؟ UI پیچیده تکرار را ارائه نکند.
- mobile با agenda/week و فرم جایگزین drag.

## Activity composer
Activity type، linked entity، owner، start/due/end، reminder و notes. ایجاد از رکورد association را پیش‌فرض کند اما visible باشد. Reminder job واقعی؛ cancelled/deleted activity در timeline شفاف.

## Date/time
Store canonical timestamp؛ render در timezone طبق policy. Date-only مثل close date نباید ناخواسته timezone-shift شود. DST، locale و Jalali/Gregorian در صورت پشتیبانی جدا تست شوند.

## Acceptance
Activity از CRM detail در timeline دیده شود؛ تغییر due date در task/calendar sync شود؛ permissions برای participant و linked record؛ duplicate reminders با idempotency مهار شوند.
